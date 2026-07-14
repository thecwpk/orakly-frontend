import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { ok } from "../../_lib/response";
import {
  getTraderLeaderboard,
  type TraderLeaderboardSort,
} from "@/server/queries/leaderboard.service";

const PERIODS = new Set(["all", "month", "week"]);
const WINDOWS = new Set(["24h", "7d", "30d", "all"]);
const SORTS = new Set(["volume", "accuracy", "profit", "winRate", "pnl"]);

/** GET — trader leaderboard. Supports ?sort=volume|accuracy|profit and ?period=all|month|week */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const periodRaw = sp.get("period")?.trim().toLowerCase() ?? null;
  const period = periodRaw && PERIODS.has(periodRaw) ? periodRaw : undefined;

  const windowRaw = sp.get("window") ?? "all";
  const window = WINDOWS.has(windowRaw)
    ? (windowRaw as "24h" | "7d" | "30d" | "all")
    : "all";

  const takeRaw = Number.parseInt(sp.get("take") ?? "50", 10);
  const take = Number.isFinite(takeRaw) ? takeRaw : 50;
  const sortRaw = sp.get("sort") ?? "volume";
  const sort: TraderLeaderboardSort = SORTS.has(sortRaw)
    ? (sortRaw as TraderLeaderboardSort)
    : "volume";
  const minTradesRaw = Number.parseInt(sp.get("minTrades") ?? "0", 10);
  const minTrades = Number.isFinite(minTradesRaw) ? minTradesRaw : 0;
  const narrative = sp.get("narrative")?.trim() || undefined;
  const address = sp.get("address")?.trim() || undefined;
  const limitRaw = Number.parseInt(sp.get("limit") ?? String(take), 10);
  const limit = Number.isFinite(limitRaw) ? limitRaw : take;

  const result = await getTraderLeaderboard({
    window,
    period,
    take: limit,
    sort,
    minTrades,
    narrative,
    address,
  });

  return NextResponse.json(ok(result), {
    headers: {
      "Cache-Control": "public, max-age=15, stale-while-revalidate=60",
    },
  });
}
