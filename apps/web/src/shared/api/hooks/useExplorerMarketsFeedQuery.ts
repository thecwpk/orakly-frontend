"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { CACHE_POLICY } from "../cache-policy";
import { fetchMarketsFeed } from "../fetchers/markets-feed";
import { queryKeys } from "../query-keys";

/**
 * Markets explorer feed — shares cache with `useMarketsFeedQuery` but polls so
 * lists drift toward fresh snapshots between websocket invalidations.
 */
export function useExplorerMarketsFeedQuery() {
  return useQuery({
    queryKey: queryKeys.markets.feed(),
    queryFn: fetchMarketsFeed,
    placeholderData: keepPreviousData,
    ...CACHE_POLICY.marketsFeed,
    refetchInterval: 60_000,
    /** Interval polling already refreshes; skip extra churn on tab focus. */
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });
}
