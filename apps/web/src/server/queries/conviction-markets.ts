import { MarketStatus } from "@prisma/client";
import { prisma } from "@orakly/database";
import type { HubMarketEnriched } from "@/shared/contracts/hub-home";
import { marketConvictionScore } from "@/widgets/dapp-hub/lib/conviction-score";
import { prismaMarketToFeedDto } from "./market-feed-mapper";
import { getAttentionDashboardRows } from "./attention-dashboard";

function momentumPct(score: number, previous: number | null): number | null {
  if (previous == null || previous <= 0) return null;
  return Number((((score - previous) / previous) * 100).toFixed(2));
}

export async function getConvictionMarkets(take = 6): Promise<HubMarketEnriched[]> {
  const [rows, attentionRows] = await Promise.all([
    prisma.market.findMany({
      where: { status: MarketStatus.OPEN },
      select: {
        id: true,
        slug: true,
        title: true,
        volumeTotalUsd: true,
        volume24hUsd: true,
        liquidityUsd: true,
        yesPrice: true,
        closesAt: true,
        status: true,
        createdAt: true,
        category: { select: { name: true } },
        marketSuggestion: { select: { narrative: true } },
      },
      take: 80,
    }),
    getAttentionDashboardRows(),
  ]);

  const attentionMap = new Map(attentionRows.map((r) => [r.narrative, r]));

  const enriched = rows.map((m) => {
    const base = prismaMarketToFeedDto(m);
    const narrative = m.marketSuggestion?.narrative ?? null;
    const att = narrative ? attentionMap.get(narrative) : undefined;
    return {
      ...base,
      volume24hUsd: Number(m.volume24hUsd),
      conviction: marketConvictionScore(base.probability),
      attentionScore: att?.score ?? null,
      momentumPct: att ? att.momentumPct : null,
      createdAt: m.createdAt.toISOString(),
    } satisfies HubMarketEnriched;
  });

  enriched.sort((a, b) => {
    if (b.conviction !== a.conviction) return b.conviction - a.conviction;
    return b.volume24hUsd - a.volume24hUsd;
  });

  return enriched.slice(0, take);
}
