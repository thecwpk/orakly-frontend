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

/** GET /api/v1/profile/:address/trades — paginated (?limit=&page= or ?take=&cursor=). */
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

    const sp = req.nextUrl.searchParams;
    const limitRaw = Number.parseInt(sp.get("limit") ?? sp.get("take") ?? "20", 10);
    const take = Math.min(Number.isFinite(limitRaw) ? limitRaw : 20, 100);
    const pageRaw = Number.parseInt(sp.get("page") ?? "1", 10);
    const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
    const cursorParam = sp.get("cursor");

    let cursor: string | null = cursorParam;
    let currentPage = 1;

    // Advance cursor for requested page when using page mode without explicit cursor.
    if (!cursorParam && page > 1) {
      let walk: string | null = null;
      for (let i = 1; i < page; i += 1) {
        const step = await getTraderProfileTrades(address, { take, cursor: walk });
        if (!step.nextCursor) {
          return NextResponse.json(
            ok({ trades: [], nextCursor: null, page, hasMore: false }),
            {
              headers: {
                "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30",
              },
            },
          );
        }
        walk = step.nextCursor;
        currentPage = i + 1;
      }
      cursor = walk;
    }

    const data = await getTraderProfileTrades(address, { take, cursor });

    return NextResponse.json(
      ok({
        trades: data.trades,
        nextCursor: data.nextCursor,
        page: cursorParam ? currentPage : page,
        hasMore: Boolean(data.nextCursor),
      }),
      {
        headers: { "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30" },
      },
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(err("PROFILE_TRADES_UNAVAILABLE", message), {
      status: 503,
    });
  }
}
