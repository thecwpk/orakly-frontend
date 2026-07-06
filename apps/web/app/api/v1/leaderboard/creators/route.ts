import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { ok } from "../../_lib/response";
import { getCreatorLeaderboard } from "@/server/queries/leaderboard.service";

/** GET /api/v1/leaderboard/creators — creator fee earnings leaderboard (public). */
export async function GET(req: NextRequest) {
  const limitRaw = Number.parseInt(req.nextUrl.searchParams.get("limit") ?? "50", 10);
  const limit = Number.isFinite(limitRaw) ? limitRaw : 50;

  const rows = await getCreatorLeaderboard({ limit });

  return NextResponse.json(ok(rows), {
    headers: {
      "Cache-Control": "public, max-age=30, stale-while-revalidate=120",
    },
  });
}
