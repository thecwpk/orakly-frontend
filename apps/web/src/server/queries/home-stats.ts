import { MarketStatus } from "@prisma/client";
import { prisma } from "@orakly/database";
import type { HomeStatsPayload, MarketSentiment } from "@/shared/contracts/hub-home";

function sentimentFromIndex(attentionIndex: number): MarketSentiment {
  if (attentionIndex >= 70) return "Bullish";
  if (attentionIndex >= 40) return "Neutral";
  return "Bearish";
}

function toNum(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export async function getHomeStats(): Promise<HomeStatsPayload> {
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [
    topAttention,
    liveMarkets,
    volumeAgg,
    openInterestAgg,
    attentionUpdates24h,
    activeNarratives,
    recentTrades,
    openPositions,
  ] = await Promise.all([
    prisma.attentionScore.findMany({
      orderBy: { score: "desc" },
      take: 5,
      select: {
        score: true,
        narrativeName: true,
        narrative: true,
      },
    }),
    prisma.market.count({ where: { status: MarketStatus.OPEN } }),
    prisma.market.aggregate({
      where: { status: MarketStatus.OPEN },
      _sum: { volume24hUsd: true },
    }),
    prisma.market.aggregate({
      where: { status: MarketStatus.OPEN },
      _sum: { collateralPoolUsd: true },
    }),
    prisma.attentionScore.count({
      where: { updatedAt: { gte: since24h } },
    }),
    prisma.attentionScore.count({
      where: { score: { gt: 50 } },
    }),
    prisma.trade.findMany({
      where: { executedAt: { gte: since24h } },
      select: {
        buyer: { select: { walletAddress: true } },
        seller: { select: { walletAddress: true } },
      },
      take: 12_000,
    }),
    prisma.position.findMany({
      where: { market: { status: MarketStatus.OPEN } },
      select: {
        portfolio: {
          select: { user: { select: { walletAddress: true } } },
        },
      },
      take: 20_000,
    }),
  ]);

  const attentionIndex =
    topAttention.length === 0
      ? 0
      : Math.round(
          (topAttention.reduce((sum, row) => sum + toNum(row.score), 0) /
            topAttention.length) *
            10,
        ) / 10;

  const topRow = topAttention[0];
  const currentMeta =
    topRow?.narrativeName?.trim() ||
    topRow?.narrative?.trim() ||
    "Crypto";

  const wallets = new Set<string>();
  for (const trade of recentTrades) {
    const buyer = trade.buyer.walletAddress?.toLowerCase();
    const seller = trade.seller.walletAddress?.toLowerCase();
    if (buyer) wallets.add(buyer);
    if (seller) wallets.add(seller);
  }
  for (const pos of openPositions) {
    const addr = pos.portfolio.user.walletAddress?.toLowerCase();
    if (addr) wallets.add(addr);
  }

  /** Prefer mark-to-market position value; fall back to collateral pools. */
  let openInterest = toNum(openInterestAgg._sum.collateralPoolUsd);
  try {
    const positions = await prisma.position.findMany({
      where: { market: { status: MarketStatus.OPEN } },
      select: {
        quantity: true,
        side: true,
        avgEntryPrice: true,
        market: {
          select: {
            yesPrice: true,
            noPrice: true,
            probability: true,
          },
        },
      },
      take: 20_000,
    });
    if (positions.length > 0) {
      openInterest = positions.reduce((sum, p) => {
        const qty = toNum(p.quantity);
        const yes = toNum(p.market.probability ?? p.market.yesPrice);
        const no = toNum(p.market.noPrice) || (yes > 0 ? 1 - yes : 0.5);
        const mark =
          p.side === "YES"
            ? yes || toNum(p.avgEntryPrice) || 0.5
            : no || toNum(p.avgEntryPrice) || 0.5;
        return sum + qty * mark;
      }, 0);
    }
  } catch {
    /* keep collateral fallback */
  }

  const narrativeFallback =
    activeNarratives === 0
      ? await prisma.attentionScore.count()
      : activeNarratives;

  return {
    attentionIndex,
    sentiment: sentimentFromIndex(attentionIndex),
    currentMeta,
    topChain: "BNB",
    volume24hUsd: toNum(volumeAgg._sum.volume24hUsd),
    openInterest: Math.round(openInterest * 100) / 100,
    liveMarkets,
    activeTraders: wallets.size,
    activeNarratives: narrativeFallback,
    attentionUpdates24h,
  };
}
