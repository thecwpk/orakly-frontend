import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { API_ERROR_CODES } from "../../../_lib/errors";
import { err, ok } from "../../../_lib/response";
import {
  getTraderProfileTrades,
  normalizeProfileAddress,
} from "@/server/queries/trader-profile";

type RouteCtx = { params: Promise<{ address: string }> };

function isLikelyWalletAddress(value: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
}

/** GET /api/v1/profile/:address/trades — paginated trade history for a wallet. */
export async function GET(req: NextRequest, ctx: RouteCtx) {
  try {
    const { address: rawAddress } = await ctx.params;
    const address = normalizeProfileAddress(decodeURIComponent(rawAddress));

    if (!isLikelyWalletAddress(address)) {
      return NextResponse.json(
        err(API_ERROR_CODES.VALIDATION, "Invalid wallet address"),
        { status: 400 },
      );
    }

    const take = Math.min(
      Number.parseInt(req.nextUrl.searchParams.get("take") ?? "20", 10) || 20,
      100,
    );
    const cursor = req.nextUrl.searchParams.get("cursor");

    const data = await getTraderProfileTrades(address, { take, cursor });

    return NextResponse.json(ok(data), {
      headers: { "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30" },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(err("PROFILE_TRADES_UNAVAILABLE", message), {
      status: 503,
    });
  }
}
