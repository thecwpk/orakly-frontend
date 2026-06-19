import { MarketStatus } from "@prisma/client";
import { prisma } from "@orakly/database";
import type { HubMarketEnriched } from "@/shared/contracts/hub-home";
import { marketConvictionScore } from "@/widgets/dapp-hub/lib/conviction-score";
import { prismaMarketToFeedDto } from "./market-feed-mapper";
import { getAttentionDashboardRows } from "./attention-dashboard";
import { buildNarrativeMarketWhere, marketMatchesNarrative } from "./hub-narrative-match";

export type HubTrendingFilter = {
  categorySlug?: string | null;
  narrative?: string | null;
  breaking?: boolean;
};

export async function getHubTrendingMarkets(
  take = 20,
  filter: HubTrendingFilter = {},
): Promise<HubMarketEnriched[]> {
  const cat = filter.categorySlug?.trim().toLowerCase();
  const narrative = filter.narrative?.trim();
  const breaking = filter.breaking === true;

  const [rows, attentionRows] = await Promise.all([
    prisma.market.findMany({
      where: {
        status: MarketStatus.OPEN,
        ...(cat && cat !== "all" ? { category: { slug: cat } } : {}),
        ...(narrative ? buildNarrativeMarketWhere(narrative) : {}),
        ...(breaking
          ? {
              cryptoSignalId: { not: null },
              signalLastSeenAt: { not: null },
            }
          : {}),
      },
      orderBy: breaking
        ? [{ signalLastSeenAt: "desc" }, { externalMomentumScore: "desc" }, { volume24hUsd: "desc" }]
        : [{ volume24hUsd: "desc" }, { volumeTotalUsd: "desc" }],
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
        category: { select: { name: true, slug: true } },
        marketSuggestion: { select: { narrative: true } },
      },
    }),
    getAttentionDashboardRows(),
  ]);

  const attentionMap = new Map(attentionRows.map((r) => [r.narrative, r]));

  return rows.map((m) => {
    const base = prismaMarketToFeedDto(m);
    const rowNarrative = m.marketSuggestion?.narrative ?? null;
    const attNarrative =
      rowNarrative ??
      attentionRows.find((r) =>
        marketMatchesNarrative(
          { title: m.title, category: m.category, marketSuggestion: m.marketSuggestion },
          r.narrative,
        ),
      )?.narrative ??
      null;
    const att = attNarrative ? attentionMap.get(attNarrative) : undefined;
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
