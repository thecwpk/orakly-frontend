"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { CACHE_POLICY } from "../cache-policy";
import { fetchMarketProbability } from "../fetchers/market-probability";
import { queryKeys } from "../query-keys";

export function useMarketProbabilityQuery(marketId: string | undefined) {
  return useQuery({
    queryKey:
      marketId ?
        queryKeys.markets.probability(marketId)
      : [...queryKeys.markets.root(), "probability", "__idle"],
    queryFn: () => fetchMarketProbability(marketId!),
    enabled: !!marketId,
    ...CACHE_POLICY.marketOdds,
    placeholderData: keepPreviousData,
  });
}
