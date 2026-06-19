import { NextRequest, NextResponse } from "next/server";
import { ok, err } from "../../_lib/response";
import { getHubTrendingMarkets } from "@/server/queries/hub-trending-markets";

/** GET /api/v1/markets/trending-hub — 24h volume sorted table rows. */
export async function GET(req: NextRequest) {
  const takeRaw = req.nextUrl.searchParams.get("take");
  const take = Math.min(50, Math.max(1, Number(takeRaw) || 20));
  const cat = req.nextUrl.searchParams.get("cat");

  try {
    const data = await getHubTrendingMarkets(take, cat);
    return NextResponse.json(ok(data), {
      headers: { "Cache-Control": "public, s-maxage=45, stale-while-revalidate=90" },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(err("TRENDING_UNAVAILABLE", message), { status: 503 });
  }
}
