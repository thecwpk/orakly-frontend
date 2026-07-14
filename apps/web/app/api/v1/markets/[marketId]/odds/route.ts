import { NextResponse } from "next/server";
import { getMarketOdds } from "@/server/trading/queries";
import { getMarketOddsChart } from "@/server/queries/market-detail";
import type { MarketOddsPeriod } from "@/shared/contracts/market-detail";
import { ok, err } from "../../../_lib/response";
import { API_ERROR_CODES } from "../../../_lib/errors";

type RouteCtx = { params: Promise<{ marketId: string }> };

function parsePeriod(raw: string | null): MarketOddsPeriod | null {
  if (!raw) return null;
  const u = raw.trim().toUpperCase();
  if (u === "1H" || u === "24H" || u === "7D" || u === "ALL") {
    return u === "ALL" ? "All" : (u as MarketOddsPeriod);
  }
  return null;
}

/**
 * GET /api/v1/markets/:id/odds
 * - Default: live odds snapshot
 * - ?period=1H|24H|7D|All → probability chart series
 */
export async function GET(req: Request, ctx: RouteCtx) {
  const { marketId } = await ctx.params;
  const period = parsePeriod(new URL(req.url).searchParams.get("period"));

  if (period) {
    try {
      const points = await getMarketOddsChart(marketId, period);
      return NextResponse.json(ok(points), {
        headers: {
          "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
        },
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      return NextResponse.json(err("ODDS_UNAVAILABLE", message), { status: 503 });
    }
  }

  const row = await getMarketOdds(marketId);
  if (!row) {
    return NextResponse.json(err(API_ERROR_CODES.NOT_FOUND, "Market not found"), {
      status: 404,
    });
  }

  return NextResponse.json(
    ok({
      ...row,
      yesPrice: row.yesPrice?.toFixed() ?? null,
      noPrice: row.noPrice?.toFixed() ?? null,
      liquidityUsd: row.liquidityUsd.toFixed(),
      collateralPoolUsd: row.collateralPoolUsd.toFixed(),
      volume24hUsd: row.volume24hUsd.toFixed(),
      volumeTotalUsd: row.volumeTotalUsd.toFixed(),
    }),
  );
}
