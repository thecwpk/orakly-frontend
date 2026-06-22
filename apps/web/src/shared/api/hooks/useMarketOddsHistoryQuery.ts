"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { CACHE_POLICY } from "../cache-policy";
import { fetchMarketOddsHistory } from "../fetchers/markets-live";
import { queryKeys } from "../query-keys";

export function useMarketOddsHistoryQuery(marketId: string | undefined, hours = 168) {
  return useQuery({
    queryKey:
      marketId ?
        queryKeys.markets.oddsHistory(marketId, hours)
      : [...queryKeys.markets.root(), "oddsHistory", "__idle"],
    queryFn: () => fetchMarketOddsHistory(marketId!, hours),
    enabled: !!marketId,
    staleTime: CACHE_POLICY.marketOdds.staleTime,
    placeholderData: keepPreviousData,
  });
}
