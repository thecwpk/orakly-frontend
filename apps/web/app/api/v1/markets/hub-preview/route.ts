import type { NextRequest } from "next/server";
import { unstable_cache } from "next/cache";
import { MarketStatus } from "@prisma/client";
import { prisma } from "@orakly/database";
import { NextResponse } from "next/server";
import { err, ok } from "../../_lib/response";
import {
  getHubMarketsPreview,
  hubMoversRankingEnabled,
} from "@/server/queries/hub-markets-preview";
import { MarketsFeedDatabaseError } from "@/server/queries/markets-feed-scoped";
import { scheduleMarketsStaleRefresh } from "@/server/vercel-worker/stale-refresh";

/** GET /api/v1/markets/hub-preview — batched hub lanes + hot topics; short CDN TTL. */
export async function GET(req: NextRequest) {
  void req;

  let openBucket = "oc?";
  try {
    const openCount = await prisma.market.count({
      where: { status: MarketStatus.OPEN },
    });
    openBucket = openCount > 0 ? "oc1" : "oc0";
  } catch {
    openBucket = "ocE";
  }

  const moversFlag = hubMoversRankingEnabled() ? "m1" : "m0";

  const cachedFetch = unstable_cache(
    async () => getHubMarketsPreview(),
    ["public-markets-hub-preview", openBucket, moversFlag],
    { revalidate: 45, tags: ["markets-feed", "hub-preview"] },
  );

  if (openBucket === "ocE") {
    return NextResponse.json(
      err(
        "DATABASE_UNAVAILABLE",
        "Postgres unreachable from Vercel. Set DATABASE_URL to your Neon URL (not placeholder host “base”).",
      ),
      { status: 503 },
    );
  }

  try {
    const data = await cachedFetch();
    scheduleMarketsStaleRefresh();
    return NextResponse.json(ok(data), {
      headers: {
        "Cache-Control": "public, s-maxage=45, stale-while-revalidate=180",
      },
    });
  } catch (e) {
    if (e instanceof MarketsFeedDatabaseError) {
      return NextResponse.json(err("DATABASE_UNAVAILABLE", e.message), { status: 503 });
    }
    throw e;
  }
}
