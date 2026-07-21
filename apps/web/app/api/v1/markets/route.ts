import type { NextRequest } from "next/server";
import { unstable_cache } from "next/cache";
import { NextResponse } from "next/server";
import { MarketStatus } from "@prisma/client";
import { prisma } from "@orakly/database";
import {
  getMarketsFeedScoped,
  type MarketsFeedLane,
  type MarketsFeedScope,
  type MarketsListLaneFilter,
  type MarketsTrendingLane,
} from "@/server/queries/markets-feed-scoped";
import {
  isMarketsExplorerRequest,
  listMarketsExplorer,
  parseMarketsExplorerParams,
} from "@/server/queries/markets-explorer";
import { err, ok } from "../_lib/response";
import { MarketsFeedDatabaseError } from "@/server/queries/markets-feed-scoped";
import { scheduleMarketsStaleRefresh } from "@/server/vercel-worker/stale-refresh";

function parseLane(raw: string | null): MarketsFeedLane {
  if (raw === "trending" || raw === "list" || raw === "alpha" || raw === "directory") {
    return raw;
  }
  return "directory";
}

function parseScope(raw: string | null): MarketsFeedScope {
  return raw === "hub" ? "hub" : "full";
}

function parseTrendingBy(raw: string | null): MarketsTrendingLane {
  if (
    raw === "volume" ||
    raw === "activity" ||
    raw === "new" ||
    raw === "hot"
  ) {
    return raw;
  }
  return "volume";
}

function parseListFilter(raw: string | null): MarketsListLaneFilter {
  const allowed: MarketsListLaneFilter[] = [
    "all",
    "trending",
    "new",
    "cross_hot",
    "breaking",
    "top_gainers",
    "meme",
    "rug_watch",
    "ending_soon",
    "high_volume",
    "moonshots",
    "movers_24h",
  ];
  if (raw && (allowed as string[]).includes(raw)) {
    return raw as MarketsListLaneFilter;
  }
  return "all";
}

function parseTake(scope: MarketsFeedScope, lane: MarketsFeedLane, raw: string | null) {
  const n = Number.parseInt(raw ?? "", 10);
  const fallback =
    lane === "directory" ? 120
    : scope === "hub" ? 16
    : 60;
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return n;
}

/** GET /api/v1/markets — explorer search, live hub, narrative, or feed lanes. */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const narrative = sp.get("narrative")?.trim();

  /** Paginated Markets explorer: `?page=1&limit=20&q=&category=&…`. */
  if (isMarketsExplorerRequest(sp)) {
    try {
      const params = parseMarketsExplorerParams(sp);
      const data = await listMarketsExplorer(params);
      scheduleMarketsStaleRefresh();
      return NextResponse.json(ok(data), {
        headers: {
          "Cache-Control": "public, s-maxage=15, stale-while-revalidate=45",
        },
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      return NextResponse.json(err("MARKETS_UNAVAILABLE", message), { status: 503 });
    }
  }

  /** Narrative markets — must run before live `sort=` branch so `?narrative=&sort=volume` works. */
  if (narrative) {
    const limitParam = Number.parseInt(sp.get("limit") ?? sp.get("take") ?? "20", 10);
    const take =
      Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 100) : 20;

    try {
      const { getMarketsByNarrative } = await import("@/server/queries/narrative-markets");
      const data = await getMarketsByNarrative(narrative, take);
      scheduleMarketsStaleRefresh();
      return NextResponse.json(ok(data), {
        headers: {
          "Cache-Control": "public, s-maxage=45, stale-while-revalidate=180",
        },
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      return NextResponse.json(err("MARKETS_UNAVAILABLE", message), { status: 503 });
    }
  }

  /** Live Markets hub section: `?status=OPEN&limit=6&sort=trending|volume|newest|ending`. */
  const sortParam = sp.get("sort")?.trim();
  if (
    sortParam === "trending" ||
    sortParam === "volume" ||
    sortParam === "newest" ||
    sortParam === "ending"
  ) {
    const limitRaw = Number.parseInt(sp.get("limit") ?? sp.get("take") ?? "6", 10);
    const limit =
      Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 24) : 6;
    try {
      const { getLiveMarkets } = await import("@/server/queries/live-markets");
      const data = await getLiveMarkets({
        sort: sortParam,
        status: sp.get("status"),
        limit,
      });
      scheduleMarketsStaleRefresh();
      return NextResponse.json(ok(data), {
        headers: {
          "Cache-Control": "public, s-maxage=15, stale-while-revalidate=45",
        },
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      return NextResponse.json(err("MARKETS_UNAVAILABLE", message), { status: 503 });
    }
  }

  const scope = parseScope(sp.get("scope"));
  const lane = parseLane(sp.get("lane"));
  const trendingBy = parseTrendingBy(sp.get("trendingBy"));
  const listFilter = parseListFilter(sp.get("filter"));
  const take = parseTake(scope, lane, sp.get("take"));

  /** Hub feeds must reflect DB only — never inject static featured markets. Full explorer keeps fallback when empty. */
  const staticFallback = scope !== "hub";

  let openBucket = "oc?";
  try {
    const openCount = await prisma.market.count({
      where: { status: MarketStatus.OPEN },
    });
    openBucket = openCount > 0 ? "oc1" : "oc0";
  } catch {
    openBucket = "ocE";
  }

  const cachedFetch = unstable_cache(
    async () =>
      getMarketsFeedScoped({
        scope,
        lane,
        trendingBy: lane === "trending" ? trendingBy : undefined,
        listFilter: lane === "list" ? listFilter : undefined,
        take,
        staticFallback,
      }),
    [
      "public-markets-feed",
      scope,
      lane,
      trendingBy,
      listFilter,
      String(take),
      staticFallback ? "sf1" : "sf0",
      openBucket,
    ],
    { revalidate: 45, tags: ["markets-feed"] },
  );

  if (scope === "hub" && openBucket === "ocE") {
    return NextResponse.json(
      err(
        "DATABASE_UNAVAILABLE",
        "Postgres unreachable from Vercel. Set DATABASE_URL to your CockroachDB connection string.",
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
    if (scope === "hub" && e instanceof MarketsFeedDatabaseError) {
      return NextResponse.json(
        err("DATABASE_UNAVAILABLE", e.message),
        { status: 503 },
      );
    }
    throw e;
  }
}
