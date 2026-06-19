import { MarketStatus } from "@prisma/client";
import { prisma } from "@orakly/database";
import type { HubMarketEnriched } from "@/shared/contracts/hub-home";
import { marketConvictionScore } from "@/widgets/dapp-hub/lib/conviction-score";
import { prismaMarketToFeedDto } from "./market-feed-mapper";
import { getAttentionDashboardRows } from "./attention-dashboard";

export async function getHubTrendingMarkets(
  take = 20,
  categorySlug?: string | null,
): Promise<HubMarketEnriched[]> {
  const cat = categorySlug?.trim().toLowerCase();
  const [rows, attentionRows] = await Promise.all([
    prisma.market.findMany({
      where: {
        status: MarketStatus.OPEN,
        ...(cat && cat !== "all"
          ? { category: { slug: cat } }
          : {}),
      },
      orderBy: [{ volume24hUsd: "desc" }, { volumeTotalUsd: "desc" }],
      take,
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
    }),
    getAttentionDashboardRows(),
  ]);

  const attentionMap = new Map(attentionRows.map((r) => [r.narrative, r]));

  return rows.map((m) => {
    const base = prismaMarketToFeedDto(m);
    const narrative = m.marketSuggestion?.narrative ?? null;
    const att = narrative ? attentionMap.get(narrative) : undefined;
    return {
      ...base,
      volume24hUsd: Number(m.volume24hUsd),
      conviction: marketConvictionScore(base.probability),
      attentionScore: att?.score ?? null,
      momentumPct: att?.momentumPct ?? null,
      createdAt: m.createdAt.toISOString(),
    };
  });
}
