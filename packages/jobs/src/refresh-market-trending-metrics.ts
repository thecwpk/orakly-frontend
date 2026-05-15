import { MarketStatus, Prisma } from "@prisma/client";
import { prisma } from "@orakly/database";

/**
 * Synthetic rank from **real** fills — mirrors “what’s moving” without embedding topic semantics.
 * Logs damp whale spikes; trade count rewards liquid tape; lifetime depth avoids cold garbage.
 */
export function computeTrendingScoreFromMetrics(opts: {
  volume24hUsd: number;
  trades24h: number;
  volumeTotalUsd: number;
}): number {
  const v24 = Math.max(0, opts.volume24hUsd);
  const n = Math.max(0, opts.trades24h);
  const vt = Math.max(0, opts.volumeTotalUsd);

  const volBurst = Math.log1p(v24 / 1000) * 1000;
  const tapeActivity = Math.sqrt(n) * 180;
  const bookDepth = Math.log1p(vt / 10_000) * 120;

  return volBurst + tapeActivity + bookDepth;
}

export type RefreshMarketTrendingMetricsResult = {
  marketsUpdated: number;
  marketsWithTrades24h: number;
  windowHours: number;
};

/**
 * Reconciles `volume24hUsd` from Trade rows (true rolling window) and recomputes `trendingScore`.
 * Run hourly via cron so hub “trending / hot / activity” tracks **genuine marketplace flow**.
 */
export async function refreshMarketTrendingMetrics(
  windowHours: number = 24,
): Promise<RefreshMarketTrendingMetricsResult> {
  const cutoff = new Date(Date.now() - windowHours * 60 * 60 * 1000);

  const grouped = await prisma.trade.groupBy({
    by: ["marketId"],
    where: { executedAt: { gte: cutoff } },
    _sum: { notionalUsd: true },
    _count: { _all: true },
  });

  const aggByMarket = new Map<
    string,
    { vol24: Prisma.Decimal; trades: number }
  >();
  for (const row of grouped) {
    const sum = row._sum.notionalUsd ?? new Prisma.Decimal(0);
    aggByMarket.set(row.marketId, {
      vol24: sum,
      trades: row._count._all,
    });
  }

  const openMarkets = await prisma.market.findMany({
    where: { status: MarketStatus.OPEN },
    select: { id: true, volumeTotalUsd: true },
  });

  const chunkSize = 80;
  for (let i = 0; i < openMarkets.length; i += chunkSize) {
    const chunk = openMarkets.slice(i, i + chunkSize);
    await prisma.$transaction(
      chunk.map((m) => {
        const agg = aggByMarket.get(m.id);
        const vol24Num = agg ? Number(agg.vol24) : 0;
        const trades24 = agg?.trades ?? 0;
        const volTotalNum = Number(m.volumeTotalUsd);
        const score = computeTrendingScoreFromMetrics({
          volume24hUsd: vol24Num,
          trades24h: trades24,
          volumeTotalUsd: volTotalNum,
        });

        return prisma.market.update({
          where: { id: m.id },
          data: {
            volume24hUsd: agg?.vol24 ?? new Prisma.Decimal(0),
            trendingScore: new Prisma.Decimal(score.toFixed(6)),
            trendingUpdatedAt: new Date(),
          },
        });
      }),
    );
  }

  return {
    marketsUpdated: openMarkets.length,
    marketsWithTrades24h: aggByMarket.size,
    windowHours,
  };
}
