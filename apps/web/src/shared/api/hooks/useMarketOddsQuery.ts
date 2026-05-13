"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { CACHE_POLICY } from "../cache-policy";
import { fetchMarketOdds } from "../fetchers/markets-live";
import { queryKeys } from "../query-keys";

export function useMarketOddsQuery(marketId: string | undefined) {
  return useQuery({
    queryKey:
      marketId ?
        queryKeys.markets.odds(marketId)
      : [...queryKeys.markets.root(), "odds", "__idle"],
    queryFn: () => fetchMarketOdds(marketId!),
    enabled: !!marketId,
    ...CACHE_POLICY.marketOdds,
    placeholderData: keepPreviousData,
  });
}
