import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { ok } from "../../_lib/response";
import {
  getTraderLeaderboard,
  type TraderLeaderboardSort,
} from "@/server/queries/leaderboard.service";

const WINDOWS = new Set(["24h", "7d", "30d", "all"]);
const SORTS = new Set(["volume", "winRate", "pnl"]);

/** GET — trader volume leaderboard (same-origin; no external backend required). */
export async function GET(req: NextRequest) {
  const windowRaw = req.nextUrl.searchParams.get("window") ?? "all";
  const window = WINDOWS.has(windowRaw)
    ? (windowRaw as "24h" | "7d" | "30d" | "all")
    : "all";
  const takeRaw = Number.parseInt(req.nextUrl.searchParams.get("take") ?? "50", 10);
  const take = Number.isFinite(takeRaw) ? takeRaw : 50;
  const sortRaw = req.nextUrl.searchParams.get("sort") ?? "volume";
  const sort: TraderLeaderboardSort = SORTS.has(sortRaw)
    ? (sortRaw as TraderLeaderboardSort)
    : "volume";
  const minTradesRaw = Number.parseInt(
    req.nextUrl.searchParams.get("minTrades") ?? "0",
    10,
  );
  const minTrades = Number.isFinite(minTradesRaw) ? minTradesRaw : 0;

  const rows = await getTraderLeaderboard({ window, take, sort, minTrades });
  return NextResponse.json(ok(rows), {
    headers: {
      "Cache-Control": "public, max-age=15, stale-while-revalidate=60",
    },
  });
}
