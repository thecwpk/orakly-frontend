import { NextRequest, NextResponse } from "next/server";
import { ok, err } from "../../_lib/response";
import { getPublicMarketSuggestions } from "@/server/queries/market-suggestions-public";

/** GET /api/v1/markets/suggestions — community market ideas. */
export async function GET(req: NextRequest) {
  const takeRaw = req.nextUrl.searchParams.get("take");
  const take = Math.min(20, Math.max(1, Number(takeRaw) || 5));

  try {
    const data = await getPublicMarketSuggestions(take);
    return NextResponse.json(ok(data), {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(err("SUGGESTIONS_UNAVAILABLE", message), { status: 503 });
  }
}
