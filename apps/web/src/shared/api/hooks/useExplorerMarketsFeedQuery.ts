"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { CACHE_POLICY } from "../cache-policy";
import { fetchMarketsFeed } from "../fetchers/markets-feed";
import { queryKeys } from "../query-keys";

/**
 * Markets explorer feed — shares cache with `useMarketsFeedQuery` but polls so
 * lists drift toward fresh snapshots between websocket invalidations.
 */
export function useExplorerMarketsFeedQuery(enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.markets.feed(),
    queryFn: fetchMarketsFeed,
    placeholderData: keepPreviousData,
    ...CACHE_POLICY.marketsFeed,
    refetchInterval: enabled
      ? (CACHE_POLICY.marketsFeed.refetchInterval || 60_000)
      : false,
    enabled,
    /** Interval polling already refreshes; skip extra churn on tab focus. */
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });
}
