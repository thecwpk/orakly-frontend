import { NextResponse } from "next/server";
import { API_ERROR_CODES } from "../../../_lib/errors";
import { err, ok } from "../../../_lib/response";
import {
  getCreatorProfileStats,
  normalizeWalletAddress,
} from "@/server/queries/leaderboard.service";

type RouteCtx = { params: Promise<{ address: string }> };

function isLikelyWalletAddress(value: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
}

/** GET /api/v1/profile/:address/creator-stats — public creator profile metrics. */
export async function GET(_req: Request, ctx: RouteCtx) {
  try {
    const { address: rawAddress } = await ctx.params;
    const address = normalizeWalletAddress(decodeURIComponent(rawAddress));

    if (!address || !isLikelyWalletAddress(address)) {
      return NextResponse.json(
        err(API_ERROR_CODES.VALIDATION, "Invalid wallet address"),
        { status: 400 },
      );
    }

    const data = await getCreatorProfileStats(address);

    return NextResponse.json(ok(data), {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(err("CREATOR_STATS_UNAVAILABLE", message), { status: 503 });
  }
}
