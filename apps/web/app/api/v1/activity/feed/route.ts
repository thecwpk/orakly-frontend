import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { ok } from "../../_lib/response";
import { getActivityFeed } from "@/server/queries/activity-feed.service";

/** GET — recent activity tape (HTTP fallback when realtime socket is offline). */
export async function GET(req: NextRequest) {
  const takeRaw = Number.parseInt(req.nextUrl.searchParams.get("take") ?? "120", 10);
  const take = Number.isFinite(takeRaw) ? takeRaw : 120;
  const rows = await getActivityFeed({ take });

  return NextResponse.json(ok(rows), {
    headers: {
      "Cache-Control": "public, max-age=10, stale-while-revalidate=30",
    },
  });
}
