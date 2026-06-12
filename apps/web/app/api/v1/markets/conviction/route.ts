import { NextRequest, NextResponse } from "next/server";
import { ok, err } from "../../_lib/response";
import { getConvictionMarkets } from "@/server/queries/conviction-markets";

/** GET /api/v1/markets/conviction — highest conviction open markets. */
export async function GET(req: NextRequest) {
  const takeRaw = req.nextUrl.searchParams.get("take");
  const take = Math.min(24, Math.max(1, Number(takeRaw) || 6));

  try {
    const data = await getConvictionMarkets(take);
    return NextResponse.json(ok(data), {
      headers: { "Cache-Control": "public, s-maxage=45, stale-while-revalidate=90" },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(err("CONVICTION_UNAVAILABLE", message), { status: 503 });
  }
}
