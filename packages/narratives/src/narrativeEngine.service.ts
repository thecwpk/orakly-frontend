import { prisma } from "@orakly/database";
import { NarrativeTrend, Prisma } from "@prisma/client";
import { getAllCoingeckoNarratives } from "./externalApis/coingecko.service.js";
import { getNews } from "./externalApis/cryptopanic.service.js";
import { getAllDefiLlamaNarratives } from "./externalApis/defillama.service.js";
import { getCryptoPosts } from "./externalApis/reddit.service.js";
import { cacheManager } from "./cache/cacheManager.service.js";
import { eventBus, SystemEvents } from "./events/eventBus.service.js";
import { NARRATIVE_KEYS } from "./lib/constants.js";

export type NarrativeScoreRow = {
  narrative: string;
  score: number;
  trend: NarrativeTrend;
  redditScore: number;
  newsScore: number;
  coingeckoMomentum: number;
  tvlGrowth: number;
  previousScore: number | null;
};

export type ComputeNarrativesResult = {
  narratives: NarrativeScoreRow[];
  volumeSpikes: string[];
};

function clampScore(v: number): number {
  return Number(Math.min(100, Math.max(0, v)).toFixed(4));
}

function normalizeComponent(v: number, max: number): number {
  if (max <= 0) return 0;
  return clampScore((v / max) * 100);
}

function resolveTrend(current: number, previous: number | null): NarrativeTrend {
  if (previous == null) return NarrativeTrend.STABLE;
  const deltaPct = previous > 0 ? ((current - previous) / previous) * 100 : 0;
  if (deltaPct > 8) return NarrativeTrend.RISING;
  if (deltaPct < -8) return NarrativeTrend.COOLING;
  return NarrativeTrend.STABLE;
}

export async function computeNarratives(): Promise<ComputeNarrativesResult> {
  const settled = await Promise.allSettled([
    getAllCoingeckoNarratives(),
    getNews(),
    getCryptoPosts(),
    getAllDefiLlamaNarratives(),
    prisma.attentionScore.findMany(),
  ]);

  const coingecko =
    settled[0].status === "fulfilled" ? settled[0].value : [];
  const news = settled[1].status === "fulfilled" ? settled[1].value : [];
  const reddit = settled[2].status === "fulfilled" ? settled[2].value : [];
  const defillama =
    settled[3].status === "fulfilled" ? settled[3].value : [];
  const existingRows =
    settled[4].status === "fulfilled" ? settled[4].value : [];

  for (let i = 0; i < settled.length; i++) {
    const s = settled[i];
    const label = ["coingecko", "cryptopanic", "reddit", "defillama", "attentionScore"][i] ?? "source";
    if (s && s.status === "rejected") {
      console.warn(`[narratives] ${label} failed:`, s.reason);
    }
  }

  const previousByNarrative = new Map(
    existingRows.map((r) => [r.narrative, Number(r.score)]),
  );

  const redditMax = Math.max(...reddit.map((r) => r.engagementScore), 1);
  const newsMax = Math.max(...news.map((r) => r.mentionScore), 1);
  const cgMax = Math.max(...coingecko.map((r) => r.momentum), 1);
  const tvlMax = Math.max(
    ...defillama.map((r) => Math.abs(r.tvlGrowthPercent)),
    1,
  );

  const volumeByNarrative = new Map<string, number>();
  for (const row of coingecko) {
    volumeByNarrative.set(
      row.narrative,
      (volumeByNarrative.get(row.narrative) ?? 0) + row.volume,
    );
  }

  const volumeSpikes: string[] = [];
  const results: NarrativeScoreRow[] = [];

  for (const narrative of NARRATIVE_KEYS) {
    const redditRow = reddit.find((r) => r.narrative === narrative);
    const newsRow = news.find((r) => r.narrative === narrative);
    const cgRow = coingecko.find((r) => r.narrative === narrative);
    const tvlRow = defillama.find((r) => r.narrative === narrative);

    const redditScore = normalizeComponent(
      redditRow?.engagementScore ?? 0,
      redditMax,
    );
    const newsScore = normalizeComponent(newsRow?.mentionScore ?? 0, newsMax);
    const coingeckoMomentum = normalizeComponent(
      cgRow?.momentum ?? 0,
      cgMax,
    );
    const tvlGrowth = normalizeComponent(
      Math.abs(tvlRow?.tvlGrowthPercent ?? 0),
      tvlMax,
    );

    const rawScore =
      redditScore * 0.3 +
      newsScore * 0.3 +
      coingeckoMomentum * 0.2 +
      tvlGrowth * 0.2;

    const score = clampScore(rawScore);
    const previousScore = previousByNarrative.get(narrative) ?? null;
    const trend = resolveTrend(score, previousScore);

    const vol = volumeByNarrative.get(narrative) ?? 0;
    const prevVol = existingRows.find((r) => r.narrative === narrative);
    const prevVolSnap =
      prevVol?.rawSnapshot &&
      typeof prevVol.rawSnapshot === "object" &&
      prevVol.rawSnapshot !== null &&
      "coingeckoVolume" in prevVol.rawSnapshot
        ? Number((prevVol.rawSnapshot as { coingeckoVolume?: number }).coingeckoVolume ?? 0)
        : 0;

    if (prevVolSnap > 0 && vol > prevVolSnap * 1.25) {
      volumeSpikes.push(narrative);
    }

    results.push({
      narrative,
      score,
      trend,
      redditScore,
      newsScore,
      coingeckoMomentum,
      tvlGrowth,
      previousScore,
    });

    await prisma.attentionScore.upsert({
      where: { narrative },
      create: {
        narrative,
        score: new Prisma.Decimal(score),
        trend,
        redditScore: new Prisma.Decimal(redditScore),
        newsScore: new Prisma.Decimal(newsScore),
        coingeckoMomentum: new Prisma.Decimal(coingeckoMomentum),
        tvlGrowth: new Prisma.Decimal(tvlGrowth),
        previousScore:
          previousScore != null ? new Prisma.Decimal(previousScore) : null,
        rawSnapshot: {
          coingeckoVolume: vol,
          sources: {
            coingecko: cgRow ?? null,
            news: newsRow ?? null,
            reddit: redditRow ?? null,
            defillama: tvlRow ?? null,
          },
        },
      },
      update: {
        score: new Prisma.Decimal(score),
        trend,
        redditScore: new Prisma.Decimal(redditScore),
        newsScore: new Prisma.Decimal(newsScore),
        coingeckoMomentum: new Prisma.Decimal(coingeckoMomentum),
        tvlGrowth: new Prisma.Decimal(tvlGrowth),
        previousScore:
          previousScore != null ? new Prisma.Decimal(previousScore) : null,
        rawSnapshot: {
          coingeckoVolume: vol,
          sources: {
            coingecko: cgRow ?? null,
            news: newsRow ?? null,
            reddit: redditRow ?? null,
            defillama: tvlRow ?? null,
          },
        },
      },
    });
  }

  await eventBus.emit(SystemEvents.ATTENTION_UPDATED, {
    narratives: results.map((r) => ({
      narrative: r.narrative,
      score: r.score,
    })),
  });

  return { narratives: results, volumeSpikes };
}

export async function getAttentionDashboard(): Promise<
  Array<{ narrative: string; score: number; trend: NarrativeTrend }>
> {
  const cached = await cacheManager.getDashboardAttention<
    Array<{ narrative: string; score: number; trend: NarrativeTrend }>
  >();
  if (cached) return cached;

  const rows = await prisma.attentionScore.findMany({
    orderBy: { updatedAt: "desc" },
  });

  const data = rows.map((r) => ({
    narrative: r.narrative,
    score: Number(r.score),
    trend: r.trend,
  }));

  if (data.length > 0) {
    await cacheManager.setDashboardAttention(data);
  }

  return data.length > 0
    ? data
    : NARRATIVE_KEYS.map((narrative) => ({
        narrative,
        score: 50,
        trend: NarrativeTrend.STABLE,
      }));
}
