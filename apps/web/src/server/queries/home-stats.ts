import { MarketStatus } from "@prisma/client";
import { prisma } from "@orakly/database";
import type { HomeStatsPayload } from "@/shared/contracts/hub-home";

export async function getHomeStats(): Promise<HomeStatsPayload> {
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [activeNarratives, liveMarkets, volumeAgg, attentionUpdates24h] =
    await Promise.all([
      prisma.attentionScore.count({
        where: { score: { gt: 50 } },
      }),
      prisma.market.count({ where: { status: MarketStatus.OPEN } }),
      prisma.market.aggregate({
        where: { status: MarketStatus.OPEN },
        _sum: { volume24hUsd: true },
      }),
      prisma.attentionScore.count({
        where: { updatedAt: { gte: since24h } },
      }),
    ]);

  const narrativeFallback =
    activeNarratives === 0
      ? await prisma.attentionScore.count()
      : activeNarratives;

  return {
    activeNarratives: narrativeFallback,
    liveMarkets,
    volume24hUsd: Number(volumeAgg._sum.volume24hUsd ?? 0),
    attentionUpdates24h,
  };
}
