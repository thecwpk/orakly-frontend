import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { ok, err } from "../../_lib/response";
import {
  getAnalyticsHistory,
  parseAnalyticsPeriod,
} from "@/server/queries/analytics-history";

/** GET /api/v1/analytics/history — attention + resolved market analytics (public). */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const { from, to } = parseAnalyticsPeriod(searchParams);

    const narrative = searchParams.get("narrative")?.trim() || undefined;
    const category = searchParams.get("category")?.trim() || undefined;

    const data = await getAnalyticsHistory({
      from,
      to,
      narrative,
      category,
    });

    return NextResponse.json(ok(data), {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=180" },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(err("ANALYTICS_HISTORY_UNAVAILABLE", message), { status: 503 });
  }
}
