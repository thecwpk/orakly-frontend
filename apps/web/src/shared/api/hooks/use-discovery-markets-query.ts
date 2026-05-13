"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  fetchMarketsFeedScoped,
  type MarketsFeedScopedParams,
} from "../fetchers/markets-feed";
import { queryKeys } from "../query-keys";
import { resolveMarketsScopedTake } from "./useMarketsFeedScopedQuery";
import { withTier } from "../cache-policy";

/**
 * Marketing discover — same cache keys as hub scoped feeds.
 * Longer staleness + slower polling than trading surfaces: list data is “good
 * enough” for browsing; users can hit Refresh for a forced snapshot.
 */
export function useDiscoveryMarketsQuery(
  params: MarketsFeedScopedParams,
  options?: { enabled?: boolean },
) {
  const enabled = options?.enabled ?? true;
  const trendingBy =
    params.lane === "trending" ? (params.trendingBy ?? "volume") : "";
  const filter = params.lane === "list" ? (params.filter ?? "all") : "";
  const take = resolveMarketsScopedTake(params);

  return useQuery({
    enabled,
    queryKey: queryKeys.markets.feedScoped({
      scope: params.scope,
      lane: params.lane,
      trendingBy,
      filter,
      take,
    }),
    queryFn: () =>
      fetchMarketsFeedScoped({
        ...params,
        trendingBy:
          params.lane === "trending" ? (params.trendingBy ?? "volume") : undefined,
        filter: params.lane === "list" ? (params.filter ?? "all") : undefined,
        take,
      }),
    placeholderData: keepPreviousData,
    ...withTier("warm", {
      staleTime: 3 * 60_000,
      refetchInterval: 2 * 60_000,
      refetchOnWindowFocus: false,
    }),
  });
}
