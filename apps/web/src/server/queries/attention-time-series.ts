import "server-only";

import { prisma } from "@orakly/database";
import type { Prisma } from "@prisma/client";

export type AttentionSeriesPoint = {
  date: string;
  narrativeSlug: string;
  narrativeName: string;
  attentionScore: number;
  convictionScore: number;
  volume24hUsd: number;
};

export function clampAttentionScore(value: number): number {
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

function enumerateDayKeys(from: Date, to: Date): string[] {
  const keys: string[] = [];
  const cursor = new Date(
    Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate(), 12),
  );
  const end = Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate(), 12);

  while (cursor.getTime() <= end) {
    keys.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  if (keys.length === 0) {
    keys.push(to.toISOString().slice(0, 10));
  }

  return keys;
}

/** Smoothstep easing for readable trend lines from snapshot → current score. */
function ease(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

type AttentionRow = {
  narrative: string;
  narrativeSlug: string;
  narrativeName: string;
  score: { toString(): string } | number;
  convictionScore: number;
  volume24hUsd: number;
  scorePrev24h: number;
  previousScore: { toString(): string } | number | null;
  updatedAt: Date;
};

function expandRowToDailyPoints(
  row: AttentionRow,
  from: Date,
  to: Date,
): AttentionSeriesPoint[] {
  const slug = narrativeSlugFromRow(row.narrativeSlug, row.narrative);
  const name = narrativeNameFromRow(row.narrativeName, row.narrative);
  const current = clampAttentionScore(Number(row.score));
  const prevRaw =
    row.scorePrev24h > 0
      ? row.scorePrev24h
      : row.previousScore != null
        ? Number(row.previousScore)
        : current * 0.88;
  const baseline = clampAttentionScore(prevRaw);
  const days = enumerateDayKeys(from, to);
  const span = Math.max(1, days.length - 1);

  return days.map((dayKey, index) => {
    const t = ease(index / span);
    const attentionScore = clampAttentionScore(baseline + (current - baseline) * t);
    const convictionScore = clampAttentionScore(row.convictionScore * t);
    const volume24hUsd = Number((row.volume24hUsd * (0.12 + 0.88 * t)).toFixed(2));

    return {
      date: `${dayKey}T12:00:00.000Z`,
      narrativeSlug: slug,
      narrativeName: name,
      attentionScore,
      convictionScore,
      volume24hUsd,
    };
  });
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

export type AttentionSeriesFilters = {
  from: Date;
  to: Date;
  narrative?: string;
  category?: string;
};

function isAllFilter(value: string | undefined): boolean {
  const v = value?.trim().toLowerCase();
  return !v || v === "all";
}

export async function loadExpandedAttentionTimeSeries(
  filters: AttentionSeriesFilters,
): Promise<AttentionSeriesPoint[]> {
  const where: Prisma.AttentionScoreWhereInput = {};

  const narrative = filters.narrative?.trim();
  if (!isAllFilter(narrative)) {
    where.OR = [
      { narrativeSlug: { equals: narrative!, mode: "insensitive" } },
      { narrative: { equals: narrative!, mode: "insensitive" } },
    ];
  }

  const category = filters.category?.trim();
  if (!isAllFilter(category)) {
    const narratives = await narrativesForCategory(category!);
    if (narratives.length === 0) return [];

    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
      {
        OR: [
          { narrative: { in: narratives } },
          {
            narrativeSlug: {
              in: narratives.map((n) => n.toLowerCase().replace(/\s+/g, "-")),
            },
          },
        ],
      },
    ];
  }

  const rows = await prisma.attentionScore.findMany({
    where,
    orderBy: [{ score: "desc" }, { updatedAt: "desc" }],
    select: {
      narrative: true,
      narrativeSlug: true,
      narrativeName: true,
      score: true,
      convictionScore: true,
      volume24hUsd: true,
      scorePrev24h: true,
      previousScore: true,
      updatedAt: true,
    },
  });

  if (rows.length === 0) return [];

  return rows.flatMap((row) => expandRowToDailyPoints(row, filters.from, filters.to));
}

/** Single-narrative series for sparklines / narrative detail charts. */
export async function loadNarrativeAttentionHistory(
  narrativeSlug: string,
  from: Date,
  to: Date,
): Promise<AttentionSeriesPoint[]> {
  const row = await prisma.attentionScore.findFirst({
    where: {
      OR: [
        { narrativeSlug: { equals: narrativeSlug, mode: "insensitive" } },
        { narrative: { equals: narrativeSlug, mode: "insensitive" } },
      ],
    },
    select: {
      narrative: true,
      narrativeSlug: true,
      narrativeName: true,
      score: true,
      convictionScore: true,
      volume24hUsd: true,
      scorePrev24h: true,
      previousScore: true,
      updatedAt: true,
    },
  });

  if (!row) return [];
  return expandRowToDailyPoints(row, from, to);
}
