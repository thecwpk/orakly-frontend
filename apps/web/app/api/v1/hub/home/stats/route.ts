import { NextResponse } from "next/server";
import { ok, err } from "../../../_lib/response";
import { getHomeStats } from "@/server/queries/home-stats";

/** GET /api/v1/hub/home/stats — Market Pulse aggregates for the DApp home. */
export async function GET() {
  try {
    const data = await getHomeStats();
    return NextResponse.json(ok(data), {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(err("STATS_UNAVAILABLE", message), { status: 503 });
  }
}
