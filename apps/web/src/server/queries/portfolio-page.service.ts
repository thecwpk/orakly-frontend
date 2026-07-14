import { MarketStatus, OutcomeSide } from "@prisma/client";
import { prisma } from "@orakly/database";
import { normalizeWalletAddress } from "./leaderboard.service";

export type PortfolioPositionStatusFilter = "open" | "closed" | "claimable" | "all";

export type PortfolioOverviewDto = {
  portfolioBalanceBnb: number;
  totalPnlBnb: number;
  totalPnlPct: number;
  openPositionsCount: number;
  pendingSettlementCount: number;
  pendingSettlementBnb: number;
};

export type PortfolioPositionRowDto = {
  id: string;
  marketId: string;
  marketSlug: string;
  marketTitle: string;
  side: "YES" | "NO";
  entryPrice: number;
  currentOdds: number;
  shares: number;
  currentValueBnb: number;
  estPayoutBnb: number;
  result: "WON" | "LOST" | null;
  exitPrice: number | null;
  pnlBnb: number | null;
  closedAt: string | null;
  claimableBnb: number | null;
  onChainAddress: string | null;
  resolvedOutcome: "YES" | "NO" | null;
  marketStatus: string;
  narrative: string | null;
};

export type PortfolioPageDto = {
  address: string;
  overview: PortfolioOverviewDto;
  openPositions: PortfolioPositionRowDto[];
  closedPositions: PortfolioPositionRowDto[];
  claimablePositions: PortfolioPositionRowDto[];
  pnlSeries: Array<{ at: string; pnl: number }>;
  analytics: {
    wins: number;
    losses: number;
    winRatePct: number;
    narrativeTrades: Array<{ narrative: string; count: number }>;
    bestTrade: {
      marketTitle: string;
      marketSlug: string;
      pnlBnb: number;
      side: "YES" | "NO";
    } | null;
  };
};

function n(v: unknown): number {
  const x = typeof v === "number" ? v : Number(v);
  return Number.isFinite(x) ? x : 0;
}

function isWinningSide(
  side: OutcomeSide,
  resolved: OutcomeSide | null | undefined,
): boolean {
  return Boolean(resolved) && side === resolved;
}

export async function getWalletPortfolioPage(
  rawAddress: string,
): Promise<PortfolioPageDto> {
  const address = normalizeWalletAddress(rawAddress);

  const user = await prisma.user.findFirst({
    where: { walletAddress: { equals: address, mode: "insensitive" } },
    select: { id: true },
  });

  if (!user) {
    return {
      address,
      overview: {
        portfolioBalanceBnb: 0,
        totalPnlBnb: 0,
        totalPnlPct: 0,
        openPositionsCount: 0,
        pendingSettlementCount: 0,
        pendingSettlementBnb: 0,
      },
      openPositions: [],
      closedPositions: [],
      claimablePositions: [],
      pnlSeries: [],
      analytics: {
        wins: 0,
        losses: 0,
        winRatePct: 0,
        narrativeTrades: [],
        bestTrade: null,
      },
    };
  }

  const [portfolio, trades] = await Promise.all([
    prisma.portfolio.findUnique({
      where: { userId: user.id },
      include: {
        positions: {
          include: {
            market: {
              select: {
                id: true,
                title: true,
                slug: true,
                status: true,
                yesPrice: true,
                noPrice: true,
                resolvedOutcome: true,
                onChainAddress: true,
                narrative: true,
                updatedAt: true,
                closesAt: true,
              },
            },
          },
        },
      },
    }),
    prisma.trade.findMany({
      where: {
        OR: [{ buyerId: user.id }, { sellerId: user.id }],
      },
      orderBy: { executedAt: "asc" },
      take: 2000,
      select: {
        id: true,
        marketId: true,
        outcome: true,
        notionalUsd: true,
        buyerId: true,
        sellerId: true,
        executedAt: true,
        market: {
          select: {
            title: true,
            slug: true,
            narrative: true,
            status: true,
            resolvedOutcome: true,
            category: { select: { name: true } },
          },
        },
      },
    }),
  ]);

  const realizedPnl = n(portfolio?.realizedPnlUsd);
  const openPositions: PortfolioPositionRowDto[] = [];
  const closedPositions: PortfolioPositionRowDto[] = [];
  const claimablePositions: PortfolioPositionRowDto[] = [];

  let openBalance = 0;
  let pendingBnb = 0;

  for (const pos of portfolio?.positions ?? []) {
    const qty = n(pos.quantity);
    if (qty <= 0) continue;

    const yesPrice = n(pos.market.yesPrice ?? 0.5);
    const noPrice = n(pos.market.noPrice ?? 1 - yesPrice);
    const entry = n(pos.avgEntryPrice);
    const currentOdds = pos.side === OutcomeSide.YES ? yesPrice : noPrice;
    const currentValue = qty * currentOdds;
    const estPayout = qty * 1; // $1 per winning share
    const status = pos.market.status;
    const resolved = pos.market.resolvedOutcome;
    const won = status === MarketStatus.RESOLVED && isWinningSide(pos.side, resolved);
    const lost =
      status === MarketStatus.RESOLVED && resolved != null && !isWinningSide(pos.side, resolved);

    const row: PortfolioPositionRowDto = {
      id: pos.id,
      marketId: pos.marketId,
      marketSlug: pos.market.slug,
      marketTitle: pos.market.title,
      side: pos.side,
      entryPrice: entry,
      currentOdds,
      shares: qty,
      currentValueBnb: Number(currentValue.toFixed(4)),
      estPayoutBnb: Number(estPayout.toFixed(4)),
      result: won ? "WON" : lost ? "LOST" : null,
      exitPrice: status === MarketStatus.RESOLVED ? (won ? 1 : 0) : null,
      pnlBnb:
        status === MarketStatus.RESOLVED
          ? Number((won ? qty * (1 - entry) : -qty * entry).toFixed(4))
          : null,
      closedAt:
        status === MarketStatus.RESOLVED
          ? pos.market.updatedAt.toISOString()
          : null,
      claimableBnb: won ? Number((qty * 1).toFixed(4)) : null,
      onChainAddress: pos.market.onChainAddress,
      resolvedOutcome: resolved ?? null,
      marketStatus: status,
      narrative: pos.market.narrative,
    };

    if (status === MarketStatus.OPEN || status === MarketStatus.PAUSED) {
      openPositions.push(row);
      openBalance += currentValue;
    }

    if (status === MarketStatus.RESOLVED) {
      closedPositions.push(row);
      if (won) {
        claimablePositions.push(row);
        pendingBnb += qty;
      }
    }
  }

  // Cumulative PnL series from sells (+) / buys (-) as cashflow proxy, then scale end to realized
  let cum = 0;
  const rawPoints: Array<{ at: string; pnl: number }> = [];
  for (const trade of trades) {
    const notional = n(trade.notionalUsd);
    const isBuy = trade.buyerId === user.id;
    cum += isBuy ? -notional : notional;
    rawPoints.push({ at: trade.executedAt.toISOString(), pnl: cum });
  }

  const end = rawPoints.length > 0 ? rawPoints[rawPoints.length - 1]!.pnl : 0;
  const scale =
    Math.abs(end) > 1e-9 ? realizedPnl / end : realizedPnl === 0 ? 1 : 0;
  const pnlSeries =
    rawPoints.length === 0
      ? [
          { at: new Date().toISOString(), pnl: 0 },
          { at: new Date().toISOString(), pnl: realizedPnl },
        ]
      : rawPoints.map((p) => ({
          at: p.at,
          pnl: Number((p.pnl * (Number.isFinite(scale) ? scale : 1)).toFixed(4)),
        }));

  // Cost basis proxy for % change
  const costBasis = openPositions.reduce(
    (sum, p) => sum + p.shares * p.entryPrice,
    0,
  );
  const totalPnlPct =
    Math.abs(costBasis + Math.abs(realizedPnl)) > 1e-9
      ? Number(
          (
            (realizedPnl / Math.max(costBasis + Math.abs(realizedPnl), 1e-9)) *
            100
          ).toFixed(2),
        )
      : 0;

  // Analytics
  let wins = 0;
  let losses = 0;
  const narrativeCounts = new Map<string, number>();
  let bestTrade: PortfolioPageDto["analytics"]["bestTrade"] = null;

  for (const trade of trades) {
    const narrative =
      trade.market.narrative?.trim() ||
      trade.market.category?.name?.trim() ||
      "Other";
    narrativeCounts.set(narrative, (narrativeCounts.get(narrative) ?? 0) + 1);

    if (trade.market.status !== MarketStatus.RESOLVED || !trade.market.resolvedOutcome) {
      continue;
    }
    const won = trade.outcome === trade.market.resolvedOutcome;
    if (won) wins += 1;
    else losses += 1;

    const notional = n(trade.notionalUsd);
    // Rough: winning buy pays ~qty - notional; approximate pnl as notional * (1/price-ish)
    const estPnl = won ? notional * 0.5 : -notional;
    if (!bestTrade || estPnl > bestTrade.pnlBnb) {
      bestTrade = {
        marketTitle: trade.market.title,
        marketSlug: trade.market.slug,
        pnlBnb: Number(estPnl.toFixed(4)),
        side: trade.outcome,
      };
    }
  }

  // Prefer closed position PnL for best trade when available
  for (const closed of closedPositions) {
    if (closed.pnlBnb == null) continue;
    if (!bestTrade || closed.pnlBnb > bestTrade.pnlBnb) {
      bestTrade = {
        marketTitle: closed.marketTitle,
        marketSlug: closed.marketSlug,
        pnlBnb: closed.pnlBnb,
        side: closed.side,
      };
    }
  }

  const resolvedTotal = wins + losses;
  const narrativeTrades = [...narrativeCounts.entries()]
    .map(([narrative, count]) => ({ narrative, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return {
    address,
    overview: {
      portfolioBalanceBnb: Number(openBalance.toFixed(4)),
      totalPnlBnb: Number(realizedPnl.toFixed(4)),
      totalPnlPct,
      openPositionsCount: openPositions.length,
      pendingSettlementCount: claimablePositions.length,
      pendingSettlementBnb: Number(pendingBnb.toFixed(4)),
    },
    openPositions,
    closedPositions,
    claimablePositions,
    pnlSeries,
    analytics: {
      wins,
      losses,
      winRatePct:
        resolvedTotal > 0
          ? Number(((wins / resolvedTotal) * 100).toFixed(1))
          : 0,
      narrativeTrades,
      bestTrade,
    },
  };
}
