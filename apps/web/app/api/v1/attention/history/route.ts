import { NextResponse } from "next/server";
import { prisma } from "@orakly/database";
import { API_ERROR_CODES } from "../../_lib/errors";
import { ok, err } from "../../_lib/response";

type Period = "24h" | "7d" | "30d" | "90d";

type AttentionHistoryPoint = {
  date: string;
  attentionScore: number;
  convictionScore: number;
  volume24hUsd: number;
  momentum: string;
};

type AttentionHistoryPayload = {
  narrative: string;
  period: Period;
  data: AttentionHistoryPoint[];
};

const PERIOD_MS: Record<Period, number> = {
  "24h": 24 * 3_600_000,
  "7d": 7 * 24 * 3_600_000,
  "30d": 30 * 24 * 3_600_000,
  "90d": 90 * 24 * 3_600_000,
};

function parsePeriod(raw: string | null): Period {
  if (raw === "24h" || raw === "7d" || raw === "30d" || raw === "90d") {
    return raw;
  }
  return "7d";
}

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Number(value.toFixed(2))));
}

/** GET /api/v1/attention/history — attention score time series for charts (public). */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const narrative = searchParams.get("narrative")?.trim() ?? "";

    if (!narrative) {
      return NextResponse.json(
        err(API_ERROR_CODES.VALIDATION, "Query param `narrative` is required"),
        { status: 400 },
      );
    }

    const period = parsePeriod(searchParams.get("period"));
    const fromDate = new Date(Date.now() - PERIOD_MS[period]);

    const rows = await prisma.attentionScore.findMany({
      where: {
        narrativeSlug: narrative,
        createdAt: { gte: fromDate },
      },
      orderBy: { createdAt: "asc" },
      select: {
        score: true,
        convictionScore: true,
        volume24hUsd: true,
        momentum: true,
        createdAt: true,
      },
    });

    const data: AttentionHistoryPoint[] = rows.map((row) => ({
      date: row.createdAt.toISOString(),
      attentionScore: clampScore(Number(row.score)),
      convictionScore: clampScore(row.convictionScore),
      volume24hUsd: row.volume24hUsd,
      momentum: row.momentum?.trim() || "Stable",
    }));

    const payload: AttentionHistoryPayload = {
      narrative,
      period,
      data,
    };

    return NextResponse.json(ok(payload), {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(err("ATTENTION_HISTORY_UNAVAILABLE", message), { status: 503 });
  }
}
