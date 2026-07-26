import "server-only";

import { Prisma } from "@prisma/client";
import { prisma } from "@orakly/database";
import { prismaMarketToFeedDto } from "./market-feed-mapper";
import { isPublicVisibleMarket } from "./public-tradeable-market";
import type { MarketDetailDto } from "@/shared/contracts/market-detail";
import type { MarketOddsChartPoint, MarketOddsPeriod } from "@/shared/contracts/market-detail";
import type { MarketTradeDetailDto } from "@/shared/contracts/market-detail";

async function participantCount(marketId: string): Promise<number> {
  try {
    const rows = await prisma.$queryRaw<Array<{ participants: bigint }>>(Prisma.sql`
      SELECT COUNT(DISTINCT wallet)::bigint AS participants
      FROM (
        SELECT LOWER(COALESCE(b."walletAddress", '')) AS wallet
        FROM "Trade" t
        INNER JOIN "User" b ON b.id = t."buyerId"
        WHERE t."marketId" = ${marketId}::uuid
        UNION ALL
        SELECT LOWER(COALESCE(s."walletAddress", '')) AS wallet
        FROM "Trade" t
        INNER JOIN "User" s ON s.id = t."sellerId"
        WHERE t."marketId" = ${marketId}::uuid
      ) t
      WHERE wallet <> ''
    `);
    return Number(rows[0]?.participants ?? 0);
  } catch {
    return 0;
  }
}

export async function getMarketDetailBySlug(
  slug: string,
): Promise<MarketDetailDto | null> {
  const row = await prisma.market.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      volumeTotalUsd: true,
      liquidityUsd: true,
      yesPrice: true,
      closesAt: true,
      status: true,
      resolutionStatus: true,
      resolutionReason: true,
      resolvedOutcome: true,
      generationMeta: true,
      onChainAddress: true,
      chainId: true,
      createdAt: true,
      creatorAddress: true,
      resolutionSource: true,
      creatorRewardPercent: true,
      narrative: true,
      attentionScore: true,
      convictionScore: true,
      momentum: true,
      category: { select: { name: true } },
      creator: { select: { displayName: true, walletAddress: true } },
    },
  });

  if (!row) return null;

  // Undeployed / draft markets are admin-only — hide from public detail.
  if (!isPublicVisibleMarket(row)) return null;

  const base = prismaMarketToFeedDto(row);
  const participants = await participantCount(row.id);
  const creatorAddress =
    row.creatorAddress?.toLowerCase() ||
    row.creator?.walletAddress?.toLowerCase() ||
    null;

  return {
    ...base,
    backendMarketId: row.id,
    creatorAddress,
    resolutionSource: row.resolutionSource ?? null,
    creatorRewardPercent: row.creatorRewardPercent ?? 0,
    narrative: row.narrative ?? null,
    attentionScore: row.attentionScore ?? null,
    convictionScore: row.convictionScore ?? null,
    momentum: row.momentum || "Stable",
    participants,
    createdAt: row.createdAt.toISOString(),
    rawStatus: row.status,
  };
}

function periodToHours(period: MarketOddsPeriod): number | null {
  switch (period) {
    case "1H":
      return 1;
    case "24H":
      return 24;
    case "7D":
      return 168;
    case "All":
      return null;
    default:
      return 24;
  }
}

export async function getMarketOddsChart(
  marketId: string,
  period: MarketOddsPeriod,
): Promise<MarketOddsChartPoint[]> {
  const hours = periodToHours(period);
  const since = hours == null ? null : new Date(Date.now() - hours * 3_600_000);

  const rows = await prisma.marketOddsSnapshot.findMany({
    where: {
      marketId,
      ...(since ? { recordedAt: { gte: since } } : {}),
    },
    orderBy: { recordedAt: "asc" },
    take: period === "1H" ? 60 : period === "24H" ? 120 : 240,
    select: { midYes: true, recordedAt: true },
  });

  return rows.map((r) => {
    const yes = Math.round(Number(r.midYes) * 10_000) / 100;
    return {
      time: r.recordedAt.toISOString(),
      yes,
      no: Math.round((100 - yes) * 100) / 100,
      volume: 0,
    };
  });
}

export async function listMarketTradesDetail(
  marketId: string,
  take: number,
  skip = 0,
): Promise<MarketTradeDetailDto[]> {
  const rows = await prisma.trade.findMany({
    where: { marketId },
    orderBy: { executedAt: "desc" },
    take,
    skip,
    select: {
      id: true,
      marketId: true,
      outcome: true,
      price: true,
      quantity: true,
      notionalUsd: true,
      buyerId: true,
      sellerId: true,
      takerId: true,
      externalRef: true,
      executedAt: true,
      taker: { select: { walletAddress: true } },
      buyer: { select: { walletAddress: true } },
    },
  });

  return rows.map((t) => {
    const isBuy = t.takerId === t.buyerId;
    const wallet =
      t.taker.walletAddress?.toLowerCase() ||
      t.buyer.walletAddress?.toLowerCase() ||
      null;
    const ref = t.externalRef?.trim() || null;
    const txHash =
      ref && /^0x[a-fA-F0-9]{64}$/.test(ref) ? ref : null;

    return {
      id: t.id,
      marketId: t.marketId,
      time: t.executedAt.toISOString(),
      walletAddress: wallet,
      side: t.outcome === "NO" ? ("NO" as const) : ("YES" as const),
      direction: isBuy ? ("BUY" as const) : ("SELL" as const),
      amount: Number(t.notionalUsd),
      shares: Number(t.quantity),
      price: Number(t.price),
      txHash,
    };
  });
}
