import "server-only";

import { MarketStatus, Prisma } from "@prisma/client";
import { prisma } from "@orakly/database";

export type AnalyticsHistoryFilters = {
  from: Date;
  to: Date;
  narrative?: string;
  category?: string;
};

export type AnalyticsAttentionPoint = {
  date: string;
  narrativeSlug: string;
  narrativeName: string;
  attentionScore: number;
  convictionScore: number;
  volume24hUsd: number;
};

export type AnalyticsResolvedMarket = {
  id: string;
  question: string;
  narrative: string | null;
  creatorAddress: string | null;
  outcome: string | null;
  totalVolume: number;
  uniqueTraders: number;
  resolvedAt: string | null;
};

export type AnalyticsHistoryPayload = {
  period: { from: string; to: string };
  attentionTimeSeries: AnalyticsAttentionPoint[];
  resolvedMarkets: AnalyticsResolvedMarket[];
  summary: {
    totalVolume: number;
    totalMarkets: number;
    resolvedMarkets: number;
    avgAttentionScore: number;
  };
};

const THIRTY_DAYS_MS = 30 * 24 * 3_600_000;

export function parseAnalyticsDateParam(raw: string | null, fallback: Date): Date {
  if (!raw?.trim()) return fallback;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return fallback;
  return parsed;
}

export function parseAnalyticsPeriod(searchParams: URLSearchParams): { from: Date; to: Date } {
  const now = new Date();
  const defaultFrom = new Date(now.getTime() - THIRTY_DAYS_MS);

  let to = parseAnalyticsDateParam(searchParams.get("to"), now);
  let from = parseAnalyticsDateParam(searchParams.get("from"), defaultFrom);

  if (from.getTime() > to.getTime()) {
    [from, to] = [to, from];
  }

  return { from, to };
}

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Number(value.toFixed(2))));
}

function narrativeSlugFromRow(slug: string, narrative: string): string {
  const s = slug.trim();
  if (s) return s;
  return narrative.trim().toLowerCase().replace(/\s+/g, "-");
}

function narrativeNameFromRow(name: string, narrative: string): string {
  const n = name.trim();
  return n || narrative.trim();
}

async function narrativesForCategory(categorySlug: string): Promise<string[]> {
  const rows = await prisma.market.findMany({
    where: {
      narrative: { not: null },
      category: { slug: { equals: categorySlug, mode: "insensitive" } },
    },
    select: { narrative: true },
    distinct: ["narrative"],
  });

  return rows
    .map((row) => row.narrative?.trim())
    .filter((value): value is string => Boolean(value));
}

function buildMarketWhere(
  filters: AnalyticsHistoryFilters,
  extra?: Prisma.MarketWhereInput,
): Prisma.MarketWhereInput {
  const where: Prisma.MarketWhereInput = {
    createdAt: { gte: filters.from, lte: filters.to },
    ...extra,
  };

  const narrative = filters.narrative?.trim();
  if (narrative && narrative.toLowerCase() !== "all") {
    where.narrative = { equals: narrative, mode: "insensitive" };
  }

  const category = filters.category?.trim();
  if (category) {
    where.category = { slug: { equals: category, mode: "insensitive" } };
  }

  return where;
}

async function loadAttentionTimeSeries(
  filters: AnalyticsHistoryFilters,
): Promise<AnalyticsAttentionPoint[]> {
  const attentionWhere: Prisma.AttentionScoreWhereInput = {
    createdAt: { gte: filters.from, lte: filters.to },
  };

  const narrative = filters.narrative?.trim();
  if (narrative && narrative.toLowerCase() !== "all") {
    attentionWhere.OR = [
      { narrativeSlug: { equals: narrative, mode: "insensitive" } },
      { narrative: { equals: narrative, mode: "insensitive" } },
    ];
  }

  const category = filters.category?.trim();
  if (category) {
    const narratives = await narrativesForCategory(category);
    if (narratives.length === 0) return [];

    attentionWhere.AND = [
      ...(Array.isArray(attentionWhere.AND) ? attentionWhere.AND : attentionWhere.AND ? [attentionWhere.AND] : []),
      {
        OR: [
          { narrative: { in: narratives } },
          { narrativeSlug: { in: narratives.map((n) => n.toLowerCase().replace(/\s+/g, "-")) } },
        ],
      },
    ];
  }

  const rows = await prisma.attentionScore.findMany({
    where: attentionWhere,
    orderBy: { createdAt: "asc" },
    select: {
      createdAt: true,
      narrative: true,
      narrativeSlug: true,
      narrativeName: true,
      score: true,
      convictionScore: true,
      volume24hUsd: true,
    },
  });

  return rows.map((row) => ({
    date: row.createdAt.toISOString(),
    narrativeSlug: narrativeSlugFromRow(row.narrativeSlug, row.narrative),
    narrativeName: narrativeNameFromRow(row.narrativeName, row.narrative),
    attentionScore: clampScore(Number(row.score)),
    convictionScore: clampScore(row.convictionScore),
    volume24hUsd: row.volume24hUsd,
  }));
}

async function countUniqueTradersByMarket(
  marketIds: string[],
): Promise<Map<string, number>> {
  if (marketIds.length === 0) return new Map();

  const rows = await prisma.$queryRaw<{ market_id: string; trader_count: number }[]>(Prisma.sql`
    SELECT t.market_id, COUNT(DISTINCT t.user_id)::int AS trader_count
    FROM (
      SELECT "marketId" AS market_id, "buyerId" AS user_id
      FROM "Trade"
      WHERE "marketId" IN (${Prisma.join(marketIds.map((id) => Prisma.sql`${id}::uuid`))})
      UNION
      SELECT "marketId" AS market_id, "sellerId" AS user_id
      FROM "Trade"
      WHERE "marketId" IN (${Prisma.join(marketIds.map((id) => Prisma.sql`${id}::uuid`))})
    ) t
    GROUP BY t.market_id
  `);

  return new Map(rows.map((row) => [row.market_id, row.trader_count]));
}

async function loadResolvedMarkets(
  filters: AnalyticsHistoryFilters,
): Promise<AnalyticsResolvedMarket[]> {
  const where = buildMarketWhere(filters, {
    status: MarketStatus.RESOLVED,
    resolvedAt: { gte: filters.from, lte: filters.to },
  });

  const rows = await prisma.market.findMany({
    where,
    orderBy: { resolvedAt: "desc" },
    select: {
      id: true,
      title: true,
      narrative: true,
      creatorAddress: true,
      resolvedOutcome: true,
      volumeTotalUsd: true,
      resolvedAt: true,
    },
  });

  const traderCounts = await countUniqueTradersByMarket(rows.map((row) => row.id));

  return rows.map((row) => ({
    id: row.id,
    question: row.title,
    narrative: row.narrative,
    creatorAddress: row.creatorAddress?.toLowerCase() ?? null,
    outcome: row.resolvedOutcome ?? null,
    totalVolume: Number(row.volumeTotalUsd),
    uniqueTraders: traderCounts.get(row.id) ?? 0,
    resolvedAt: row.resolvedAt?.toISOString() ?? null,
  }));
}

export async function getAnalyticsHistory(
  filters: AnalyticsHistoryFilters,
): Promise<AnalyticsHistoryPayload> {
  const [attentionTimeSeries, resolvedMarkets, totalMarkets] = await Promise.all([
    loadAttentionTimeSeries(filters),
    loadResolvedMarkets(filters),
    prisma.market.count({ where: buildMarketWhere(filters) }),
  ]);

  const totalVolume = resolvedMarkets.reduce((sum, market) => sum + market.totalVolume, 0);
  const avgAttentionScore =
    attentionTimeSeries.length > 0
      ? Number(
          (
            attentionTimeSeries.reduce((sum, point) => sum + point.attentionScore, 0) /
            attentionTimeSeries.length
          ).toFixed(2),
        )
      : 0;

  return {
    period: {
      from: filters.from.toISOString(),
      to: filters.to.toISOString(),
    },
    attentionTimeSeries,
    resolvedMarkets,
    summary: {
      totalVolume: Number(totalVolume.toFixed(2)),
      totalMarkets,
      resolvedMarkets: resolvedMarkets.length,
      avgAttentionScore,
    },
  };
}
