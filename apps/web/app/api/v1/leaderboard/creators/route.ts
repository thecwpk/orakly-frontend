import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { ok } from "../../_lib/response";
import {
  getCreatorLeaderboard,
  type CreatorLeaderboardSort,
} from "@/server/queries/leaderboard.service";

const PERIODS = new Set(["all", "month", "week"]);
const SORTS = new Set(["fees", "score", "volume"]);

/** GET /api/v1/leaderboard/creators — supports ?sort=fees&period=all|month|week */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const limitRaw = Number.parseInt(sp.get("limit") ?? "50", 10);
  const limit = Number.isFinite(limitRaw) ? limitRaw : 50;
  const narrative = sp.get("narrative")?.trim() || undefined;
  const periodRaw = sp.get("period")?.trim().toLowerCase() ?? null;
  const period = periodRaw && PERIODS.has(periodRaw) ? periodRaw : undefined;
  const sortRaw = sp.get("sort")?.trim().toLowerCase() ?? "fees";
  const sort: CreatorLeaderboardSort = SORTS.has(sortRaw)
    ? (sortRaw as CreatorLeaderboardSort)
    : "fees";
  const address = sp.get("address")?.trim() || undefined;

  const result = await getCreatorLeaderboard({
    limit,
    narrative,
    period,
    sort,
    address,
  });

  return NextResponse.json(ok(result), {
    headers: {
      "Cache-Control": "public, max-age=30, stale-while-revalidate=120",
    },
  });
}
