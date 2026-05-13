"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { CACHE_POLICY } from "../cache-policy";
import { fetchMarketsFeed } from "../fetchers/markets-feed";
import { queryKeys } from "../query-keys";

/** Featured / feed markets — infinite staleness until invalidated (realtime / admin). */
export function useMarketsFeedQuery() {
  return useQuery({
    queryKey: queryKeys.markets.feed(),
    queryFn: fetchMarketsFeed,
    placeholderData: keepPreviousData,
    ...CACHE_POLICY.marketsFeed,
  });
}
