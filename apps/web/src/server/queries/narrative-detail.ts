import "server-only";

import { prisma } from "@orakly/database";
import { slugToDisplayName } from "@/lib/narrative-slug";
import type {
  AttentionDashboardItem,
  AttentionMomentum,
} from "@/shared/contracts/attention-dashboard";
import { countResolvedMarketsByNarrative } from "./narrative-markets";

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Number(value.toFixed(2))));
}

function normalizeMomentum(stored: string | null | undefined): AttentionMomentum {
  const v = (stored ?? "Stable").trim().toLowerCase();
  if (v === "growing" || v === "rising") return "Growing";
  if (v === "cooling") return "Cooling";
  return "Stable";
}

function slugKey(slug: string, narrative: string): string {
  const s = slug.trim();
  return s.length > 0 ? s : narrative.trim().toLowerCase().replace(/\s+/g, "-");
}

const MOCK_ROWS: Omit<AttentionDashboardItem, "id" | "lastUpdated" | "_isMock">[] = [
  {
    narrativeSlug: "ai",
    narrativeName: "AI",
    attentionScore: 72,
    convictionScore: 68,
    momentum: "Growing",
    volume24hUsd: 1_420_000,
    activeMarkets: 12,
    uniqueTraders: 340,
    liquidity: 890_000,
    openInterest: 2_100_000,
  },
  {
    narrativeSlug: "memes",
    narrativeName: "Memes",
    attentionScore: 58,
    convictionScore: 44,
    momentum: "Cooling",
    volume24hUsd: 980_000,
    activeMarkets: 9,
    uniqueTraders: 512,
    liquidity: 420_000,
    openInterest: 760_000,
  },
  {
    narrativeSlug: "base",
    narrativeName: "Base",
    attentionScore: 64,
    convictionScore: 61,
    momentum: "Growing",
    volume24hUsd: 720_000,
    activeMarkets: 7,
    uniqueTraders: 198,
    liquidity: 610_000,
    openInterest: 1_050_000,
  },
  {
    narrativeSlug: "solana",
    narrativeName: "Solana",
    attentionScore: 59,
    convictionScore: 55,
    momentum: "Stable",
    volume24hUsd: 640_000,
    activeMarkets: 8,
    uniqueTraders: 221,
    liquidity: 540_000,
    openInterest: 980_000,
  },
  {
    narrativeSlug: "rwa",
    narrativeName: "RWA",
    attentionScore: 55,
    convictionScore: 52,
    momentum: "Growing",
    volume24hUsd: 310_000,
    activeMarkets: 5,
    uniqueTraders: 87,
    liquidity: 280_000,
    openInterest: 410_000,
  },
  {
    narrativeSlug: "defi",
    narrativeName: "DeFi",
    attentionScore: 51,
    convictionScore: 49,
    momentum: "Stable",
    volume24hUsd: 520_000,
    activeMarkets: 11,
    uniqueTraders: 156,
    liquidity: 470_000,
    openInterest: 830_000,
  },
];

function mockItemForSlug(slug: string): AttentionDashboardItem | null {
  const normalized = slug.trim().toLowerCase();
  const row = MOCK_ROWS.find((r) => r.narrativeSlug === normalized);
  if (!row) return null;
  const now = new Date().toISOString();
  return {
    ...row,
    id: `mock-${row.narrativeSlug}`,
    lastUpdated: now,
    _isMock: true,
  };
}

export type NarrativeStatRow = {
  label: string;
  value: string;
  changePct: number;
};

export function pctChange24h(current: number, baseline: number): number {
  if (!Number.isFinite(current)) return 0;
  if (!Number.isFinite(baseline) || baseline === 0) {
    return current > 0 ? 100 : 0;
  }
  return Number((((current - baseline) / Math.abs(baseline)) * 100).toFixed(1));
}

function deriveBaseline(current: number, score: number, prevScore: number): number {
  if (score <= 0 || prevScore <= 0) return current;
  return current * (prevScore / score);
}

const usdCompact = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

function formatUsd(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "$0";
  return `$${usdCompact.format(value)}`;
}

function formatCount(value: number): string {
  if (!Number.isFinite(value)) return "0";
  return usdCompact.format(value);
}

export async function getNarrativeBySlug(
  slug: string,
): Promise<(AttentionDashboardItem & { scorePrev24h: number }) | null> {
  const normalized = slug.trim().toLowerCase();
  const displayName = slugToDisplayName(slug);

  const row = await prisma.attentionScore.findFirst({
    where: {
      OR: [
        { narrativeSlug: normalized },
        { narrativeSlug: slug },
        { narrative: { equals: displayName, mode: "insensitive" } },
        { narrative: { equals: slug, mode: "insensitive" } },
      ],
    },
    orderBy: { updatedAt: "desc" },
  });

  if (!row) {
    const mock = mockItemForSlug(normalized);
    if (!mock) return null;
    return { ...mock, scorePrev24h: mock.attentionScore * 0.92 };
  }

  const narrativeSlug = slugKey(row.narrativeSlug, row.narrative);
  const narrativeName =
    row.narrativeName.trim().length > 0 ? row.narrativeName.trim() : row.narrative;

  return {
    id: row.id,
    narrativeSlug,
    narrativeName,
    attentionScore: clampScore(Number(row.score)),
    convictionScore: clampScore(row.convictionScore),
    momentum: normalizeMomentum(row.momentum),
    volume24hUsd: row.volume24hUsd,
    activeMarkets: row.activeMarkets,
    uniqueTraders: row.uniqueTraders,
    liquidity: row.liquidity,
    openInterest: row.openInterest,
    lastUpdated: row.updatedAt.toISOString(),
    scorePrev24h: row.scorePrev24h,
  };
}

export async function buildNarrativeStats(
  slug: string,
  item: AttentionDashboardItem & { scorePrev24h: number },
): Promise<NarrativeStatRow[]> {
  const resolvedCount = await countResolvedMarketsByNarrative(slug);
  const { attentionScore, scorePrev24h } = item;

  const metric = (current: number) =>
    pctChange24h(current, deriveBaseline(current, attentionScore, scorePrev24h));

  return [
    {
      label: "Total Volume",
      value: formatUsd(item.volume24hUsd),
      changePct: metric(item.volume24hUsd),
    },
    {
      label: "Liquidity",
      value: formatUsd(item.liquidity),
      changePct: metric(item.liquidity),
    },
    {
      label: "Unique Traders",
      value: formatCount(item.uniqueTraders),
      changePct: metric(item.uniqueTraders),
    },
    {
      label: "Open Interest",
      value: formatUsd(item.openInterest),
      changePct: metric(item.openInterest),
    },
    {
      label: "Markets Created",
      value: String(item.activeMarkets),
      changePct: metric(item.activeMarkets),
    },
    {
      label: "Markets Resolved",
      value: String(resolvedCount),
      changePct: metric(resolvedCount),
    },
  ];
}
