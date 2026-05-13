import type { NextRequest } from "next/server";
import { unstable_cache } from "next/cache";
import { NextResponse } from "next/server";
import {
  getMarketsFeedScoped,
  type MarketsFeedLane,
  type MarketsFeedScope,
  type MarketsListLaneFilter,
  type MarketsTrendingLane,
} from "@/server/queries/markets-feed-scoped";
import { ok } from "../_lib/response";

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

/** GET /api/v1/markets — supports hub lanes + directory; defaults preserve legacy clients. */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const scope = parseScope(sp.get("scope"));
  const lane = parseLane(sp.get("lane"));
  const trendingBy = parseTrendingBy(sp.get("trendingBy"));
  const listFilter = parseListFilter(sp.get("filter"));
  const take = parseTake(scope, lane, sp.get("take"));

  /** Hub feeds must reflect DB only — never inject static featured markets. Full explorer keeps fallback when empty. */
  const staticFallback = scope !== "hub";

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
    ],
    { revalidate: 45, tags: ["markets-feed"] },
  );

  const data = await cachedFetch();

  return NextResponse.json(ok(data), {
    headers: {
      "Cache-Control": "public, s-maxage=45, stale-while-revalidate=180",
    },
  });
}
