import { prisma } from "@orakly/database";
import { MarketStatus, OutcomeSide } from "@prisma/client";

export type TraderLeaderboardRow = {
  userId: string;
  displayName: string | null;
  walletAddress: string | null;
  totalVolumeUsd: string;
  winRatePct: number;
  pnlUsd: string;
  resolvedMarkets: number;
};

export type DiscovererLeaderboardRow = {
  narrative: string;
  approvedSuggestions: number;
  votesReceived: number;
  totalVotesUp: number;
  totalVotesDown: number;
};

function windowStart(window: "24h" | "7d" | "30d" | "all"): Date | null {
  if (window === "all") return null;
  const now = Date.now();
  const ms =
    window === "24h"
      ? 24 * 60 * 60 * 1000
      : window === "7d"
        ? 7 * 24 * 60 * 60 * 1000
        : 30 * 24 * 60 * 60 * 1000;
  return new Date(now - ms);
}

export async function getTraderLeaderboard(input?: {
  window?: "24h" | "7d" | "30d" | "all";
  take?: number;
}): Promise<TraderLeaderboardRow[]> {
  const window = input?.window ?? "all";
  const take = Math.min(200, Math.max(1, input?.take ?? 50));
  const since = windowStart(window);

  const trades = await prisma.trade.findMany({
    where: since ? { executedAt: { gte: since } } : undefined,
    select: {
      buyerId: true,
      sellerId: true,
      notionalUsd: true,
    },
  });

  const volumeByUser = new Map<string, number>();
  for (const t of trades) {
    for (const userId of [t.buyerId, t.sellerId]) {
      volumeByUser.set(
        userId,
        (volumeByUser.get(userId) ?? 0) + Number(t.notionalUsd),
      );
    }
  }

  const userIds = [...volumeByUser.keys()];
  if (userIds.length === 0) return [];

  const [users, portfolios, resolvedMarkets] = await Promise.all([
    prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, displayName: true, walletAddress: true },
    }),
    prisma.portfolio.findMany({
      where: { userId: { in: userIds } },
      select: { userId: true, realizedPnlUsd: true },
    }),
    prisma.market.findMany({
      where: { status: MarketStatus.RESOLVED, resolvedOutcome: { not: null } },
      select: {
        id: true,
        resolvedOutcome: true,
      },
    }),
  ]);

  const portfolioByUser = new Map(
    portfolios.map((p) => [p.userId, p.realizedPnlUsd]),
  );
  const userById = new Map(users.map((u) => [u.id, u]));

  const resolvedIds = resolvedMarkets.map((m) => m.id);
  const outcomeByMarket = new Map(
    resolvedMarkets.map((m) => [m.id, m.resolvedOutcome as OutcomeSide]),
  );

  const positions =
    resolvedIds.length > 0
      ? await prisma.position.findMany({
          where: { marketId: { in: resolvedIds } },
          select: {
            portfolioId: true,
            marketId: true,
            side: true,
            portfolio: { select: { userId: true } },
          },
        })
      : [];

  const winStats = new Map<string, { wins: number; total: number }>();
  for (const pos of positions) {
    const userId = pos.portfolio.userId;
    const resolved = outcomeByMarket.get(pos.marketId);
    if (!resolved) continue;

    const stats = winStats.get(userId) ?? { wins: 0, total: 0 };
    stats.total += 1;
    if (pos.side === resolved) stats.wins += 1;
    winStats.set(userId, stats);
  }

  const rows: TraderLeaderboardRow[] = userIds.map((userId) => {
    const user = userById.get(userId);
    const stats = winStats.get(userId) ?? { wins: 0, total: 0 };
    const winRatePct =
      stats.total > 0 ? Number(((stats.wins / stats.total) * 100).toFixed(2)) : 0;

    return {
      userId,
      displayName: user?.displayName ?? null,
      walletAddress: user?.walletAddress ?? null,
      totalVolumeUsd: (volumeByUser.get(userId) ?? 0).toFixed(2),
      winRatePct,
      pnlUsd: (portfolioByUser.get(userId) ?? 0).toString(),
      resolvedMarkets: stats.total,
    };
  });

  return rows
    .sort((a, b) => Number(b.totalVolumeUsd) - Number(a.totalVolumeUsd))
    .slice(0, take);
}

export type UserDiscovererLeaderboardRow = {
  userId: string;
  displayName: string | null;
  walletAddress: string | null;
  approvedMarkets: number;
  suggestionsSubmitted: number;
  votesReceived: number;
};

export async function getUserDiscovererLeaderboard(input?: {
  take?: number;
}): Promise<UserDiscovererLeaderboardRow[]> {
  const take = Math.min(100, Math.max(1, input?.take ?? 20));

  const rows = await prisma.marketSuggestion.groupBy({
    by: ["submitterId"],
    where: { submitterId: { not: null } },
    _count: { _all: true },
    _sum: { votesUp: true, votesDown: true },
  });

  const approved = await prisma.marketSuggestion.groupBy({
    by: ["submitterId"],
    where: { submitterId: { not: null }, status: "APPROVED" },
    _count: { _all: true },
  });

  const approvedByUser = new Map(
    approved.map((r) => [r.submitterId as string, r._count._all]),
  );

  const userIds = rows.map((r) => r.submitterId).filter(Boolean) as string[];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, displayName: true, walletAddress: true },
  });
  const userById = new Map(users.map((u) => [u.id, u]));

  return rows
    .filter((r) => r.submitterId)
    .map((r) => {
      const uid = r.submitterId as string;
      const up = r._sum.votesUp ?? 0;
      const down = r._sum.votesDown ?? 0;
      const user = userById.get(uid);
      return {
        userId: uid,
        displayName: user?.displayName ?? null,
        walletAddress: user?.walletAddress ?? null,
        approvedMarkets: approvedByUser.get(uid) ?? 0,
        suggestionsSubmitted: r._count._all,
        votesReceived: up + down,
      };
    })
    .sort((a, b) => b.votesReceived - a.votesReceived || b.approvedMarkets - a.approvedMarkets)
    .slice(0, take);
}

export async function getDiscovererLeaderboard(input?: {
  take?: number;
}): Promise<DiscovererLeaderboardRow[]> {
  const take = Math.min(100, Math.max(1, input?.take ?? 20));

  const rows = await prisma.marketSuggestion.groupBy({
    by: ["narrative"],
    where: {
      status: "APPROVED",
      narrative: { not: null },
    },
    _count: { _all: true },
    _sum: { votesUp: true, votesDown: true },
  });

  return rows
    .filter((r) => r.narrative)
    .map((r) => {
      const up = r._sum.votesUp ?? 0;
      const down = r._sum.votesDown ?? 0;
      return {
        narrative: r.narrative as string,
        approvedSuggestions: r._count._all,
        votesReceived: up + down,
        totalVotesUp: up,
        totalVotesDown: down,
      };
    })
    .sort((a, b) => b.approvedSuggestions - a.approvedSuggestions)
    .slice(0, take);
}
