import { NextResponse } from "next/server";
import { prisma } from "@orakly/database";
import { ok, err } from "../../_lib/response";

type MomentumLabel = "Growing" | "Cooling" | "Stable";

type AttentionDashboardItem = {
  id: string;
  narrativeSlug: string;
  narrativeName: string;
  attentionScore: number;
  convictionScore: number;
  momentum: MomentumLabel;
  volume24hUsd: number;
  activeMarkets: number;
  uniqueTraders: number;
  liquidity: number;
  openInterest: number;
  scorePrev24h: number;
  lastUpdated: string;
  _isMock?: true;
};

type AttentionDashboardPayload = {
  data: AttentionDashboardItem[];
  total: number;
  updatedAt: string;
};

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Number(value.toFixed(2))));
}

function normalizeMomentum(stored: string | null | undefined): MomentumLabel {
  const v = (stored ?? "Stable").trim().toLowerCase();
  if (v === "growing" || v === "rising") return "Growing";
  if (v === "cooling") return "Cooling";
  return "Stable";
}

function slugKey(slug: string, narrative: string): string {
  const s = slug.trim();
  return s.length > 0 ? s : narrative.trim().toLowerCase().replace(/\s+/g, "-");
}

function mockAttentionRows(): AttentionDashboardItem[] {
  const now = new Date().toISOString();
  const mocks: Omit<AttentionDashboardItem, "id" | "lastUpdated" | "_isMock">[] = [
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
      scorePrev24h: 61,
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
      scorePrev24h: 66,
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
      scorePrev24h: 54,
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
      scorePrev24h: 58,
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
      scorePrev24h: 46,
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
      scorePrev24h: 50,
    },
  ];

  return mocks.map((row) => ({
    ...row,
    id: `mock-${row.narrativeSlug}`,
    lastUpdated: now,
    _isMock: true as const,
  }));
}

function mapRow(row: {
  id: string;
  narrative: string;
  narrativeSlug: string;
  narrativeName: string;
  score: { toString(): string };
  convictionScore: number;
  momentum: string;
  volume24hUsd: number;
  activeMarkets: number;
  uniqueTraders: number;
  liquidity: number;
  openInterest: number;
  scorePrev24h: number;
  updatedAt: Date;
}): AttentionDashboardItem {
  const narrativeSlug = slugKey(row.narrativeSlug, row.narrative);
  const narrativeName =
    row.narrativeName.trim().length > 0 ? row.narrativeName.trim() : row.narrative;
  const attentionScore = clampScore(Number(row.score));

  return {
    id: row.id,
    narrativeSlug,
    narrativeName,
    attentionScore,
    convictionScore: clampScore(row.convictionScore),
    momentum: normalizeMomentum(row.momentum),
    volume24hUsd: row.volume24hUsd,
    activeMarkets: row.activeMarkets,
    uniqueTraders: row.uniqueTraders,
    liquidity: row.liquidity,
    openInterest: row.openInterest,
    scorePrev24h:
      Number.isFinite(row.scorePrev24h) && row.scorePrev24h > 0
        ? row.scorePrev24h
        : attentionScore * 0.92,
    lastUpdated: row.updatedAt.toISOString(),
  };
}

/** GET /api/v1/dashboard/attention — narrative attention scores for hub. */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = Number.parseInt(searchParams.get("limit") ?? "20", 10);
    const limit =
      Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 100) : 20;

    const rows = await prisma.attentionScore.findMany({
      orderBy: { updatedAt: "desc" },
    });

    let items: AttentionDashboardItem[];

    if (rows.length === 0) {
      items = mockAttentionRows();
    } else {
      const latestBySlug = new Map<string, (typeof rows)[number]>();
      for (const row of rows) {
        const key = slugKey(row.narrativeSlug, row.narrative);
        if (!latestBySlug.has(key)) {
          latestBySlug.set(key, row);
        }
      }
      items = [...latestBySlug.values()].map(mapRow);
    }

    items.sort((a, b) => b.attentionScore - a.attentionScore);

    const total = items.length;
    const data = items.slice(0, limit);
    const updatedAt =
      data.length > 0
        ? data.reduce(
            (max, row) => (row.lastUpdated > max ? row.lastUpdated : max),
            data[0]!.lastUpdated,
          )
        : new Date().toISOString();

    const payload: AttentionDashboardPayload = { data, total, updatedAt };

    return NextResponse.json(ok(payload), {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(err("ATTENTION_UNAVAILABLE", message), { status: 503 });
  }
}
