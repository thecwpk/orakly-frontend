import type { MarketsFeedScopedParams } from "@/shared/api/fetchers/markets-feed";

/** Discover marketing tabs — each maps to a server `GET /api/v1/markets` scoped feed. */
export type DiscoverTab =
  | "all"
  | "list_trending"
  | "list_new"
  | "cross_hot"
  | "breaking"
  | "vol"
  | "activity"
  | "hot"
  | "new_trend"
  | "alpha";

/**
 * Maps UI tab → API params. Uses server ordering (`trendingScore`, `createdAt`,
 * `volume24h`, etc.) — do not replace with client-only sorts on the slim
 * `Market` DTO; that breaks lane semantics (e.g. “new” vs “closing soon”).
 */
export function discoverTabToFeedParams(tab: DiscoverTab): MarketsFeedScopedParams {
  switch (tab) {
    case "all":
      return { scope: "full", lane: "directory", take: 200 };
    case "list_trending":
      return { scope: "full", lane: "list", filter: "trending", take: 120 };
    case "list_new":
      return { scope: "full", lane: "list", filter: "new", take: 120 };
    case "cross_hot":
      return { scope: "full", lane: "list", filter: "cross_hot", take: 120 };
    case "breaking":
      return { scope: "full", lane: "list", filter: "breaking", take: 120 };
    case "vol":
      return { scope: "full", lane: "trending", trendingBy: "volume", take: 120 };
    case "activity":
      return { scope: "full", lane: "trending", trendingBy: "activity", take: 120 };
    case "hot":
      return { scope: "full", lane: "trending", trendingBy: "hot", take: 120 };
    case "new_trend":
      return { scope: "full", lane: "trending", trendingBy: "new", take: 120 };
    case "alpha":
      return { scope: "full", lane: "alpha", take: 48 };
  }
}

/** @deprecated Use discoverTabToFeedParams — kept for imports that only need directory. */
export const DISCOVER_DIRECTORY_PARAMS = discoverTabToFeedParams("all");

/** @deprecated Use discoverTabToFeedParams — kept for imports that only need alpha. */
export const DISCOVER_ALPHA_PARAMS = discoverTabToFeedParams("alpha");
