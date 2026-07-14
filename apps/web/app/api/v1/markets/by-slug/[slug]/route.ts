import { NextResponse } from "next/server";
import { getMarketDetailBySlug } from "@/server/queries/market-detail";
import { API_ERROR_CODES } from "../../../_lib/errors";
import { err, ok } from "../../../_lib/response";

type RouteCtx = { params: Promise<{ slug: string }> };

/** GET /api/v1/markets/by-slug/:slug — full market detail for trading page. */
export async function GET(_req: Request, ctx: RouteCtx) {
  const { slug: raw } = await ctx.params;
  const slug = decodeURIComponent(raw).trim();
  if (!slug) {
    return NextResponse.json(err(API_ERROR_CODES.VALIDATION, "Missing slug"), {
      status: 400,
    });
  }

  try {
    const market = await getMarketDetailBySlug(slug);
    if (!market) {
      return NextResponse.json(err(API_ERROR_CODES.NOT_FOUND, "Market not found"), {
        status: 404,
      });
    }

    return NextResponse.json(ok(market), {
      headers: {
        "Cache-Control": "public, s-maxage=5, stale-while-revalidate=30",
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(err("MARKETS_UNAVAILABLE", message), { status: 503 });
  }
}
