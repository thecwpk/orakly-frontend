"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { CACHE_POLICY } from "../cache-policy";
import { fetchMarketTrades } from "../fetchers/market-trades";
import { queryKeys } from "../query-keys";

export function useMarketTradesQuery(
  marketId: string | undefined,
  take = 50,
) {
  return useQuery({
    queryKey:
      marketId ?
        queryKeys.markets.trades(marketId)
      : [...queryKeys.markets.root(), "trades", "__idle"],
    queryFn: () => fetchMarketTrades(marketId!, take),
    enabled: !!marketId,
    staleTime: 15_000,
    placeholderData: keepPreviousData,
  });
}
