import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { ok, err } from "../../_lib/response";
import { getMarketActivityFeed } from "@/server/queries/activity-feed.service";
import { getNarrativeTimeline } from "@/server/queries/narrative-timeline";

/**
 * GET /api/v1/activity/feed?limit=10&narrative=ai
 * When narrative is set, returns narrative timeline events.
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const limitRaw = Number.parseInt(
    sp.get("limit") ?? sp.get("take") ?? "10",
    10,
  );
  const limit = Number.isFinite(limitRaw) ? limitRaw : 10;
  const narrative = sp.get("narrative")?.trim();

  try {
    if (narrative) {
      const rows = await getNarrativeTimeline(narrative, limit);
      return NextResponse.json(ok(rows), {
        headers: {
          "Cache-Control": "public, max-age=10, stale-while-revalidate=30",
        },
      });
    }

    const rows = await getMarketActivityFeed({ limit });
    return NextResponse.json(ok(rows), {
      headers: {
        "Cache-Control": "public, max-age=5, stale-while-revalidate=20",
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(err("ACTIVITY_FEED_UNAVAILABLE", message), {
      status: 503,
    });
  }
}
