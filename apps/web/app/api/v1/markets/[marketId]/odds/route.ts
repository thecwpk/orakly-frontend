import { NextResponse } from "next/server";
import { getMarketOdds } from "@/server/trading/queries";
import { ok, err } from "../../../_lib/response";
import { API_ERROR_CODES } from "../../../_lib/errors";

type RouteCtx = { params: Promise<{ marketId: string }> };

export async function GET(_req: Request, ctx: RouteCtx) {
  const { marketId } = await ctx.params;
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
