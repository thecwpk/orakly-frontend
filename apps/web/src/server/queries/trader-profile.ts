import "server-only";

import { MarketStatus } from "@prisma/client";
import { prisma } from "@orakly/database";
import {
  getUserPortfolio,
  listUserTrades,
} from "@/server/trading/queries";
import { getTraderLeaderboard } from "./leaderboard.service";

export function normalizeProfileAddress(raw: string): string {
  return raw.trim().toLowerCase();
}

function parseUsd(value: string | null | undefined): number {
  if (value == null || value === "") return 0;
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

function markPrice(
  side: "YES" | "NO",
  yesPrice: string | null,
  noPrice: string | null,
): number {
  const raw = side === "YES" ? yesPrice : noPrice;
  const n = parseUsd(raw);
  return n > 0 ? n : 0.5;
}

export type ProfilePositionDto = {
  marketId: string;
  marketSlug: string;
  marketTitle: string;
  side: "YES" | "NO";
  amountUsd: number;
  oddsPct: number;
  estPayoutUsd: number;
};

export type ProfileTradeDto = {
  id: string;
  at: string;
  marketSlug: string;
  marketTitle: string;
  marketCategory: string;
  side: "YES" | "NO";
  amountUsd: number;
  status: "open" | "won" | "lost";
  txHash: string | null;
};

export type TraderProfileDto = {
  address: string;
  displayName: string | null;
  joinedAt: string | null;
  userId: string | null;
  rank: number;
  stats: {
    winRatePct: number;
    totalPnlUsd: number;
    totalVolumeUsd: number;
    openPositions: number;
  };
  positions: ProfilePositionDto[];
  trades: ProfileTradeDto[];
  tradesNextCursor: string | null;
};

function tradeStatus(
  marketStatus: MarketStatus,
  tradeOutcome: "YES" | "NO",
  resolvedOutcome: string | null | undefined,
): ProfileTradeDto["status"] {
  if (marketStatus !== MarketStatus.RESOLVED) return "open";
  if (!resolvedOutcome) return "open";
  return tradeOutcome === resolvedOutcome ? "won" : "lost";
}

export async function getTraderProfileByAddress(
  rawAddress: string,
): Promise<TraderProfileDto | null> {
  const address = normalizeProfileAddress(rawAddress);
  if (!/^0x[a-f0-9]{40}$/.test(address)) return null;

  const user = await prisma.user.findFirst({
    where: { walletAddress: { equals: address, mode: "insensitive" } },
    select: { id: true, displayName: true, walletAddress: true, createdAt: true },
  });

  const leaderboardResult = await getTraderLeaderboard({ window: "all", take: 500 });
  const leaderboard = leaderboardResult.rows;
  const row = user
    ? leaderboard.find((entry) => entry.userId === user.id) ??
      leaderboard.find(
        (entry) => entry.walletAddress?.toLowerCase() === address,
      )
    : leaderboard.find((entry) => entry.walletAddress?.toLowerCase() === address);

  const rank = row ? leaderboard.indexOf(row) + 1 : leaderboard.length + 1;

  let positions: ProfilePositionDto[] = [];
  let totalPnlUsd = row ? parseUsd(row.pnlUsd) : 0;
  let trades: ProfileTradeDto[] = [];
  let tradesNextCursor: string | null = null;

  if (!user) {
    return {
      address,
      displayName: row?.displayName ?? null,
      joinedAt: null,
      userId: null,
      rank,
      stats: {
        winRatePct: row?.winRatePct ?? 0,
        totalPnlUsd: row ? parseUsd(row.pnlUsd) : 0,
        totalVolumeUsd: row ? parseUsd(row.totalVolumeUsd) : 0,
        openPositions: 0,
      },
      positions: [],
      trades: [],
      tradesNextCursor: null,
    };
  }

  const [portfolio, tradePage] = await Promise.all([
      getUserPortfolio(user.id),
      listUserTrades({ userId: user.id, take: 200 }),
    ]);

    tradesNextCursor = tradePage.nextCursor;

    const marketIds = [
      ...new Set(tradePage.trades.map((trade) => trade.marketId)),
    ];
    const markets = marketIds.length
      ? await prisma.market.findMany({
          where: { id: { in: marketIds } },
          select: {
            id: true,
            title: true,
            slug: true,
            status: true,
            resolvedOutcome: true,
            category: { select: { name: true } },
          },
        })
      : [];
    const marketById = new Map(markets.map((market) => [market.id, market]));

    trades = tradePage.trades.map((trade) => {
      const market = marketById.get(trade.marketId);
      const ref = trade.externalRef?.trim() ?? "";
      const txHash = /^0x[a-fA-F0-9]{64}$/.test(ref) ? ref : null;
      return {
        id: trade.id,
        at:
          trade.executedAt instanceof Date
            ? trade.executedAt.toISOString()
            : String(trade.executedAt),
        marketSlug: market?.slug ?? trade.marketId,
        marketTitle: market?.title ?? "Market",
        marketCategory: market?.category?.name ?? "General",
        side: trade.outcome,
        amountUsd: parseUsd(trade.notionalUsd),
        status: tradeStatus(
          market?.status ?? MarketStatus.OPEN,
          trade.outcome,
          market?.resolvedOutcome ?? null,
        ),
        txHash,
      };
    });

    positions = portfolio.positions
      .filter((position) => parseUsd(position.quantity) > 0)
      .map((position) => {
        const qty = parseUsd(position.quantity);
        const odds = markPrice(
          position.side,
          position.market.yesPrice,
          position.market.noPrice,
        );
        return {
          marketId: position.marketId,
          marketSlug: position.market.slug,
          marketTitle: position.market.title,
          side: position.side,
          amountUsd: qty * parseUsd(position.avgEntryPrice),
          oddsPct: Math.round(odds * 100),
          estPayoutUsd: qty,
        };
      });

    const realized = parseUsd(portfolio.realizedPnlUsd);
    let unrealized = 0;
    for (const position of portfolio.positions) {
      const qty = parseUsd(position.quantity);
      const entry = parseUsd(position.avgEntryPrice);
      const mark = markPrice(
        position.side,
        position.market.yesPrice,
        position.market.noPrice,
      );
      unrealized += qty * (mark - entry);
    }
    totalPnlUsd = realized + unrealized;

  return {
    address: user.walletAddress?.toLowerCase() ?? address,
    displayName: user.displayName ?? row?.displayName ?? null,
    joinedAt: user.createdAt.toISOString(),
    userId: user.id,
    rank,
    stats: {
      winRatePct: row?.winRatePct ?? 0,
      totalPnlUsd,
      totalVolumeUsd: row ? parseUsd(row.totalVolumeUsd) : 0,
      openPositions: positions.length,
    },
    positions,
    trades,
    tradesNextCursor,
  };
}

export async function getTraderProfileTrades(
  rawAddress: string,
  input: { take?: number; cursor?: string | null },
): Promise<{ trades: ProfileTradeDto[]; nextCursor: string | null }> {
  const address = normalizeProfileAddress(rawAddress);
  const user = await prisma.user.findFirst({
    where: { walletAddress: { equals: address, mode: "insensitive" } },
    select: { id: true },
  });

  if (!user) {
    return { trades: [], nextCursor: null };
  }

  const tradePage = await listUserTrades({
    userId: user.id,
    take: input.take ?? 20,
    cursor: input.cursor,
  });

  const marketIds = [...new Set(tradePage.trades.map((trade) => trade.marketId))];
  const markets = marketIds.length
    ? await prisma.market.findMany({
        where: { id: { in: marketIds } },
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          resolvedOutcome: true,
          category: { select: { name: true } },
        },
      })
    : [];
  const marketById = new Map(markets.map((market) => [market.id, market]));

  return {
    trades: tradePage.trades.map((trade) => {
      const market = marketById.get(trade.marketId);
      const ref = trade.externalRef?.trim() ?? "";
      const txHash = /^0x[a-fA-F0-9]{64}$/.test(ref) ? ref : null;
      return {
        id: trade.id,
        at:
          trade.executedAt instanceof Date
            ? trade.executedAt.toISOString()
            : String(trade.executedAt),
        marketSlug: market?.slug ?? trade.marketId,
        marketTitle: market?.title ?? "Market",
        marketCategory: market?.category?.name ?? "General",
        side: trade.outcome,
        amountUsd: parseUsd(trade.notionalUsd),
        status: tradeStatus(
          market?.status ?? MarketStatus.OPEN,
          trade.outcome,
          market?.resolvedOutcome ?? null,
        ),
        txHash,
      };
    }),
    nextCursor: tradePage.nextCursor,
  };
}
