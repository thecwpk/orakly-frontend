import { prisma } from "@orakly/database";
import { MarketStatus, MarketSuggestionStatus, OutcomeSide } from "@prisma/client";
import { ensurePlatformLiquidityUserId } from "../trading/platform-user";
import { narrativeMarketWhere } from "./narrative-markets";

export type LeaderboardPeriod = "all" | "month" | "week";
export type LeaderboardWindow = "24h" | "7d" | "30d" | "all";

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
  avgTradeSizeUsd: number;
  activeSince: string | null;
  /** Present when wallet also has approved creator markets. */
  creatorScore: number | null;
};

export type TraderLeaderboardSort =
  | "volume"
  | "winRate"
  | "pnl"
  | "accuracy"
  | "profit";

export type TraderLeaderboardViewer = {
  rank: number | null;
  qualifies: boolean;
  tradeCount: number;
  row: TraderLeaderboardRow | null;
};

export type TraderLeaderboardResult = {
  rows: TraderLeaderboardRow[];
  total: number;
  viewer: TraderLeaderboardViewer | null;
};

function normalizeTraderSort(sort: TraderLeaderboardSort | string): "volume" | "winRate" | "pnl" {
  if (sort === "accuracy" || sort === "winRate") return "winRate";
  if (sort === "profit" || sort === "pnl") return "pnl";
  return "volume";
}

export function periodToWindow(
  period?: string | null,
  window?: string | null,
): LeaderboardWindow {
  const p = period?.trim().toLowerCase();
  if (p === "week") return "7d";
  if (p === "month") return "30d";
  if (p === "all") return "all";

  const w = window?.trim().toLowerCase();
  if (w === "24h" || w === "7d" || w === "30d" || w === "all") return w;
  return "all";
}

function sortTraderRows(
  rows: TraderLeaderboardRow[],
  sort: "volume" | "winRate" | "pnl",
): TraderLeaderboardRow[] {
  const sorted = [...rows];
  switch (sort) {
    case "winRate":
      return sorted.sort((a, b) => b.winRatePct - a.winRatePct || b.tradeCount - a.tradeCount);
    case "pnl":
      return sorted.sort(
        (a, b) => Number.parseFloat(b.pnlUsd) - Number.parseFloat(a.pnlUsd),
      );
    case "volume":
    default:
      return sorted.sort(
        (a, b) =>
          Number.parseFloat(b.totalVolumeUsd) - Number.parseFloat(a.totalVolumeUsd),
      );
  }
}

function windowStart(window: LeaderboardWindow): Date | null {
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

function computeCreatorScore(stats: CreatorFeesAggregate): number {
  return Number(
    (
      stats.marketCount * 100 +
      Math.sqrt(Math.max(0, stats.totalVolumeUsd)) * 2 +
      stats.feesEarned * 10
    ).toFixed(2),
  );
}

export async function getTraderLeaderboard(input?: {
  window?: LeaderboardWindow;
  period?: LeaderboardPeriod | string;
  take?: number;
  sort?: TraderLeaderboardSort | string;
  minTrades?: number;
  narrative?: string;
  address?: string;
}): Promise<TraderLeaderboardResult> {
  const window = periodToWindow(input?.period, input?.window);
  const take = Math.min(200, Math.max(1, input?.take ?? 50));
  const sort = normalizeTraderSort(input?.sort ?? "volume");
  const minTrades = Math.max(0, input?.minTrades ?? 0);
  const since = windowStart(window);
  const platformUserId = await ensurePlatformLiquidityUserId();
  const viewerAddress = input?.address?.trim().toLowerCase() || null;

  let narrativeMarketIds: string[] | undefined;
  const narrative = input?.narrative?.trim();
  if (narrative) {
    const markets = await prisma.market.findMany({
      where: narrativeMarketWhere(narrative),
      select: { id: true },
      take: 500,
    });
    narrativeMarketIds = markets.map((m) => m.id);
    if (narrativeMarketIds.length === 0) {
      return { rows: [], total: 0, viewer: null };
    }
  }

  const trades = await prisma.trade.findMany({
    where: {
      ...(since ? { executedAt: { gte: since } } : {}),
      ...(narrativeMarketIds ? { marketId: { in: narrativeMarketIds } } : {}),
    },
    select: {
      buyerId: true,
      sellerId: true,
      notionalUsd: true,
      marketId: true,
      executedAt: true,
    },
  });

  const volumeByUser = new Map<string, number>();
  const tradeCountByUser = new Map<string, number>();
  const bestTradeByUser = new Map<string, number>();
  const marketsByUser = new Map<string, Set<string>>();
  const firstTradeByUser = new Map<string, Date>();

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

      const prev = firstTradeByUser.get(userId);
      if (!prev || t.executedAt < prev) {
        firstTradeByUser.set(userId, t.executedAt);
      }
    }
  }

  const userIds = [...volumeByUser.keys()];
  if (userIds.length === 0) {
    return {
      rows: [],
      total: 0,
      viewer: viewerAddress
        ? { rank: null, qualifies: false, tradeCount: 0, row: null }
        : null,
    };
  }

  const [users, portfolios, resolvedMarkets, creatorFees] = await Promise.all([
    prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, displayName: true, walletAddress: true },
    }),
    prisma.portfolio.findMany({
      where: { userId: { in: userIds } },
      select: { userId: true, realizedPnlUsd: true },
    }),
    prisma.market.findMany({
      where: {
        status: MarketStatus.RESOLVED,
        resolvedOutcome: { not: null },
        ...(narrativeMarketIds ? { id: { in: narrativeMarketIds } } : {}),
      },
      select: {
        id: true,
        resolvedOutcome: true,
      },
    }),
    buildCreatorFeesMap(narrative),
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
    const volume = volumeByUser.get(userId) ?? 0;
    const tradeCount = tradeCountByUser.get(userId) ?? 0;
    const wallet = user?.walletAddress?.toLowerCase() ?? null;
    const creatorAgg = wallet ? creatorFees.get(wallet) : undefined;
    const firstTrade = firstTradeByUser.get(userId);

    return {
      userId,
      displayName: user?.displayName ?? null,
      walletAddress: user?.walletAddress ?? null,
      totalVolumeUsd: volume.toFixed(2),
      winRatePct,
      pnlUsd: (portfolioByUser.get(userId) ?? 0).toString(),
      resolvedMarkets: stats.total,
      tradeCount,
      bestTradeUsd: bestTradeByUser.get(userId) ?? 0,
      marketsTraded: marketsByUser.get(userId)?.size ?? 0,
      avgTradeSizeUsd: tradeCount > 0 ? Number((volume / tradeCount).toFixed(2)) : 0,
      activeSince: firstTrade?.toISOString() ?? null,
      creatorScore:
        creatorAgg && creatorAgg.marketCount > 0
          ? computeCreatorScore(creatorAgg)
          : null,
    };
  });

  const filtered =
    minTrades > 0
      ? rows.filter((row) => row.tradeCount >= minTrades)
      : rows;

  const sorted = sortTraderRows(filtered, sort);
  const total = sorted.length;
  const paged = sorted.slice(0, take);

  let viewer: TraderLeaderboardViewer | null = null;
  if (viewerAddress) {
    const index = sorted.findIndex(
      (row) => row.walletAddress?.toLowerCase() === viewerAddress,
    );
    if (index >= 0) {
      viewer = {
        rank: index + 1,
        qualifies: true,
        tradeCount: sorted[index]!.tradeCount,
        row: sorted[index]!,
      };
    } else {
      const raw = rows.find(
        (row) => row.walletAddress?.toLowerCase() === viewerAddress,
      );
      viewer = {
        rank: null,
        qualifies: false,
        tradeCount: raw?.tradeCount ?? 0,
        row: raw ?? null,
      };
    }
  }

  return { rows: paged, total, viewer };
}

export type CreatorLeaderboardSort = "fees" | "score" | "volume";

export type CreatorLeaderboardRow = {
  creatorAddress: string;
  marketCount: number;
  totalVolumeUsd: number;
  feesEarned: number;
  /** Weighted score: markets + volume + fees. */
  creatorScore: number;
};

export type CreatorLeaderboardResult = {
  rows: CreatorLeaderboardRow[];
  total: number;
  viewer: {
    rank: number | null;
    row: CreatorLeaderboardRow | null;
  } | null;
};

type CreatorFeesAggregate = {
  marketCount: number;
  totalVolumeUsd: number;
  feesEarned: number;
};

export async function buildCreatorFeesMap(
  narrative?: string,
  since?: Date | null,
): Promise<Map<string, CreatorFeesAggregate>> {
  const narrativeFilter = narrative?.trim()
    ? narrativeMarketWhere(narrative.trim())
    : undefined;

  const markets = await prisma.market.findMany({
    where: {
      creatorAddress: { not: null },
      ...(narrativeFilter ?? {}),
      ...(since ? { createdAt: { gte: since } } : {}),
    },
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

function sortCreatorRows(
  rows: CreatorLeaderboardRow[],
  sort: CreatorLeaderboardSort,
): CreatorLeaderboardRow[] {
  const sorted = [...rows];
  switch (sort) {
    case "volume":
      return sorted.sort((a, b) => b.totalVolumeUsd - a.totalVolumeUsd);
    case "score":
      return sorted.sort(
        (a, b) => b.creatorScore - a.creatorScore || b.feesEarned - a.feesEarned,
      );
    case "fees":
    default:
      return sorted.sort(
        (a, b) => b.feesEarned - a.feesEarned || b.creatorScore - a.creatorScore,
      );
  }
}

export async function getCreatorLeaderboard(input?: {
  limit?: number;
  narrative?: string;
  period?: LeaderboardPeriod | string;
  window?: LeaderboardWindow | string;
  sort?: CreatorLeaderboardSort | string;
  address?: string;
}): Promise<CreatorLeaderboardResult> {
  const limit = Math.min(200, Math.max(1, input?.limit ?? 50));
  const window = periodToWindow(input?.period, input?.window);
  const since = windowStart(window);
  const sortRaw = input?.sort?.trim().toLowerCase();
  const sort: CreatorLeaderboardSort =
    sortRaw === "volume" || sortRaw === "score" || sortRaw === "fees"
      ? sortRaw
      : "fees";
  const viewerAddress = input?.address?.trim().toLowerCase() || null;

  const byCreator = await buildCreatorFeesMap(input?.narrative, since);

  const all = [...byCreator.entries()].map(([creatorAddress, stats]) => ({
    creatorAddress,
    marketCount: stats.marketCount,
    totalVolumeUsd: Number(stats.totalVolumeUsd.toFixed(2)),
    feesEarned: Number(stats.feesEarned.toFixed(2)),
    creatorScore: computeCreatorScore(stats),
  }));

  const sorted = sortCreatorRows(all, sort);
  const total = sorted.length;
  const rows = sorted.slice(0, limit);

  let viewer: CreatorLeaderboardResult["viewer"] = null;
  if (viewerAddress) {
    const index = sorted.findIndex((row) => row.creatorAddress === viewerAddress);
    viewer =
      index >= 0
        ? { rank: index + 1, row: sorted[index]! }
        : { rank: null, row: null };
  }

  return { rows, total, viewer };
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
