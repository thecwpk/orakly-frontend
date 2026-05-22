import type { Market } from "@orakly/types";
import { apiClient } from "@/api/client/http-client";
import { unwrapApiResult } from "../unwrap";

export type MarketsFeedScopedLane = "trending" | "list" | "alpha" | "directory";

export type MarketsFeedScopedTrendingBy = "volume" | "activity" | "new" | "hot";

export type MarketsFeedScopedListFilter =
  | "all"
  | "trending"
  | "new"
  | "cross_hot"
  | "breaking"
  | "top_gainers"
  | "meme"
  | "rug_watch"
  | "ending_soon"
  | "high_volume"
  | "moonshots"
  | "movers_24h";

export type MarketsFeedScopedParams = {
  scope: "hub" | "full";
  lane: MarketsFeedScopedLane;
  trendingBy?: MarketsFeedScopedTrendingBy;
  filter?: MarketsFeedScopedListFilter;
  take?: number;
};

function buildMarketsFeedQueryString(params: MarketsFeedScopedParams): string {
  const qs = new URLSearchParams();
  qs.set("scope", params.scope);
  qs.set("lane", params.lane);
  if (params.lane === "trending" && params.trendingBy) {
    qs.set("trendingBy", params.trendingBy);
  }
  if (params.lane === "list" && params.filter) {
    qs.set("filter", params.filter);
  }
  if (params.take !== undefined) qs.set("take", String(params.take));
  return qs.toString();
}

export async function fetchMarketsFeedScoped(
  params: MarketsFeedScopedParams,
): Promise<Market[]> {
  const query = buildMarketsFeedQueryString(params);
  const res = await apiClient.request<Market[]>(`/api/v1/markets?${query}`);
  return unwrapApiResult(res);
}

/** Full directory slice — explorer default (`lane=directory`, larger take). */
export async function fetchMarketsFeed(): Promise<Market[]> {
  return fetchMarketsFeedScoped({
    scope: "full",
    lane: "directory",
    take: 120,
  });
}
