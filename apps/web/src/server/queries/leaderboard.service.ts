import { prisma } from "@orakly/database";
import { MarketStatus, MarketSuggestionStatus, OutcomeSide } from "@prisma/client";
import { ensurePlatformLiquidityUserId } from "../trading/platform-user";

export type TraderLeaderboardRow = {
  userId: string;
  displayName: string | null;
  walletAddress: string | null;
  totalVolumeUsd: string;
  winRatePct: number;
  pnlUsd: string;
  resolvedMarkets: number;
  tradeCount: number;
  bestTradeUsd: number;
  marketsTraded: number;
};

export type TraderLeaderboardSort = "volume" | "winRate" | "pnl";

function sortTraderRows(
  rows: TraderLeaderboardRow[],
  sort: TraderLeaderboardSort,
): TraderLeaderboardRow[] {
  const sorted = [...rows];
  switch (sort) {
    case "winRate":
      return sorted.sort((a, b) => b.winRatePct - a.winRatePct);
    case "pnl":
      return sorted.sort(
        (a, b) => Number.parseFloat(b.pnlUsd) - Number.parseFloat(a.pnlUsd),
      );
    case "volume":
    default:
      return sorted.sort(
        (a, b) => Number.parseFloat(b.totalVolumeUsd) - Number.parseFloat(a.totalVolumeUsd),
      );
  }
}

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
  sort?: TraderLeaderboardSort;
  minTrades?: number;
}): Promise<TraderLeaderboardRow[]> {
  const window = input?.window ?? "all";
  const take = Math.min(200, Math.max(1, input?.take ?? 50));
  const sort = input?.sort ?? "volume";
  const minTrades = Math.max(0, input?.minTrades ?? 0);
  const since = windowStart(window);
  const platformUserId = await ensurePlatformLiquidityUserId();

  const trades = await prisma.trade.findMany({
    where: since ? { executedAt: { gte: since } } : undefined,
    select: {
      buyerId: true,
      sellerId: true,
      notionalUsd: true,
      marketId: true,
    },
  });

  const volumeByUser = new Map<string, number>();
  const tradeCountByUser = new Map<string, number>();
  const bestTradeByUser = new Map<string, number>();
  const marketsByUser = new Map<string, Set<string>>();

  for (const t of trades) {
    const notional = Number(t.notionalUsd);
    for (const userId of [t.buyerId, t.sellerId]) {
      if (userId === platformUserId) continue;
      volumeByUser.set(userId, (volumeByUser.get(userId) ?? 0) + notional);
      tradeCountByUser.set(userId, (tradeCountByUser.get(userId) ?? 0) + 1);
      bestTradeByUser.set(
        userId,
        Math.max(bestTradeByUser.get(userId) ?? 0, notional),
      );
      const markets = marketsByUser.get(userId) ?? new Set<string>();
      markets.add(t.marketId);
      marketsByUser.set(userId, markets);
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
      tradeCount: tradeCountByUser.get(userId) ?? 0,
      bestTradeUsd: bestTradeByUser.get(userId) ?? 0,
      marketsTraded: marketsByUser.get(userId)?.size ?? 0,
    };
  });

  const filtered =
    minTrades > 0
      ? rows.filter((row) => row.tradeCount >= minTrades)
      : rows;

  return sortTraderRows(filtered, sort).slice(0, take);
}

export type CreatorLeaderboardRow = {
  creatorAddress: string;
  marketCount: number;
  totalVolumeUsd: number;
  feesEarned: number;
};

type CreatorFeesAggregate = {
  marketCount: number;
  totalVolumeUsd: number;
  feesEarned: number;
};

export async function buildCreatorFeesMap(): Promise<Map<string, CreatorFeesAggregate>> {
  const markets = await prisma.market.findMany({
    where: { creatorAddress: { not: null } },
    select: {
      creatorAddress: true,
      volumeTotalUsd: true,
      creatorRewardPercent: true,
    },
  });

  const byCreator = new Map<string, CreatorFeesAggregate>();

  for (const market of markets) {
    const creatorAddress = market.creatorAddress?.toLowerCase();
    if (!creatorAddress) continue;

    const volume = Number(market.volumeTotalUsd);
    const rewardPct = market.creatorRewardPercent ?? 0;
    const fees = (volume * rewardPct) / 100;

    const current = byCreator.get(creatorAddress) ?? {
      marketCount: 0,
      totalVolumeUsd: 0,
      feesEarned: 0,
    };

    current.marketCount += 1;
    current.totalVolumeUsd += volume;
    current.feesEarned += fees;
    byCreator.set(creatorAddress, current);
  }

  return byCreator;
}

export async function getCreatorLeaderboard(input?: {
  limit?: number;
}): Promise<CreatorLeaderboardRow[]> {
  const limit = Math.min(200, Math.max(1, input?.limit ?? 50));
  const byCreator = await buildCreatorFeesMap();

  return [...byCreator.entries()]
    .map(([creatorAddress, stats]) => ({
      creatorAddress,
      marketCount: stats.marketCount,
      totalVolumeUsd: Number(stats.totalVolumeUsd.toFixed(2)),
      feesEarned: Number(stats.feesEarned.toFixed(2)),
    }))
    .sort((a, b) => b.feesEarned - a.feesEarned)
    .slice(0, limit);
}

export type CreatorProfileMarket = {
  id: string;
  question: string;
  status: string;
  volume: number;
  feesEarned: number;
  creatorRewardPercent: number;
  createdAt: string;
};

export type CreatorProfileStats = {
  address: string;
  isCreator: boolean;
  approvedMarkets: number;
  pendingMarkets: number;
  totalVolumeGenerated: number;
  totalFeesEarned: number;
  creatorRank: number | null;
  markets: CreatorProfileMarket[];
};

const APPROVED_MARKET_STATUSES: MarketStatus[] = [
  MarketStatus.OPEN,
  MarketStatus.RESOLVED,
];

export function normalizeWalletAddress(raw: string): string {
  return raw.trim().toLowerCase();
}

export function resolveCreatorRank(
  address: string,
  feesMap: Map<string, CreatorFeesAggregate>,
): number | null {
  const ranked = [...feesMap.entries()]
    .map(([creatorAddress, stats]) => ({
      creatorAddress,
      feesEarned: stats.feesEarned,
    }))
    .sort((a, b) => b.feesEarned - a.feesEarned);

  const index = ranked.findIndex((row) => row.creatorAddress === address);
  if (index === -1) return null;

  const rank = index + 1;
  return rank <= 100 ? rank : null;
}

export async function getCreatorProfileStats(address: string): Promise<CreatorProfileStats> {
  const normalized = normalizeWalletAddress(address);

  const [markets, pendingSuggestions, feesMap] = await Promise.all([
    prisma.market.findMany({
      where: {
        creatorAddress: { equals: normalized, mode: "insensitive" },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        status: true,
        volumeTotalUsd: true,
        creatorRewardPercent: true,
        createdAt: true,
      },
    }),
    prisma.marketSuggestion.count({
      where: {
        status: { in: [MarketSuggestionStatus.PENDING, MarketSuggestionStatus.IN_REVIEW] },
        submitter: {
          walletAddress: { equals: normalized, mode: "insensitive" },
        },
      },
    }),
    buildCreatorFeesMap(),
  ]);

  const marketRows: CreatorProfileMarket[] = markets.map((market) => {
    const volume = Number(market.volumeTotalUsd);
    const creatorRewardPercent = market.creatorRewardPercent ?? 0;
    const feesEarned = (volume * creatorRewardPercent) / 100;

    return {
      id: market.id,
      question: market.title,
      status: market.status.toLowerCase(),
      volume: Number(volume.toFixed(2)),
      feesEarned: Number(feesEarned.toFixed(2)),
      creatorRewardPercent,
      createdAt: market.createdAt.toISOString(),
    };
  });

  const approvedMarkets = markets.filter((market) =>
    APPROVED_MARKET_STATUSES.includes(market.status),
  ).length;

  const aggregate = feesMap.get(normalized);
  const totalVolumeGenerated = aggregate?.totalVolumeUsd ?? 0;
  const totalFeesEarned = aggregate?.feesEarned ?? 0;

  return {
    address: normalized,
    isCreator: approvedMarkets >= 1,
    approvedMarkets,
    pendingMarkets: pendingSuggestions,
    totalVolumeGenerated: Number(totalVolumeGenerated.toFixed(2)),
    totalFeesEarned: Number(totalFeesEarned.toFixed(2)),
    creatorRank: resolveCreatorRank(normalized, feesMap),
    markets: marketRows,
  };
}
