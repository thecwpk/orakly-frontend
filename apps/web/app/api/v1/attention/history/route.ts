import { NextResponse } from "next/server";
import { API_ERROR_CODES } from "../../_lib/errors";
import { ok, err } from "../../_lib/response";
import { loadNarrativeAttentionHistory } from "@/server/queries/attention-time-series";

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
    const to = new Date();
    const from = new Date(Date.now() - PERIOD_MS[period]);

    const rows = await loadNarrativeAttentionHistory(narrative, from, to);

    const data: AttentionHistoryPoint[] = rows.map((row) => ({
      date: row.date,
      attentionScore: row.attentionScore,
      convictionScore: row.convictionScore,
      volume24hUsd: row.volume24hUsd,
      momentum: "Stable",
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
