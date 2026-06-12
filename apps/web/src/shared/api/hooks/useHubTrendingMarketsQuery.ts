"use client";

import { useQuery } from "@tanstack/react-query";
import type { HubMarketEnriched } from "@/shared/contracts/hub-home";
import { fetchHubTrendingMarkets } from "../fetchers/hub-home";
import { queryKeys } from "../query-keys";

export function useHubTrendingMarketsQuery(take = 20) {
  return useQuery<HubMarketEnriched[], Error>({
    queryKey: queryKeys.hub.trending(take),
    queryFn: () => fetchHubTrendingMarkets(take),
    staleTime: 45_000,
  });
}
