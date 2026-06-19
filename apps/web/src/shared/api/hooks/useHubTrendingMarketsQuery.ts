"use client";

import { useQuery } from "@tanstack/react-query";
import type { HubMarketEnriched } from "@/shared/contracts/hub-home";
import type { HubTrendingQueryFilter } from "../query-keys";
import { fetchHubTrendingMarkets } from "../fetchers/hub-home";
import { queryKeys } from "../query-keys";

export function useHubTrendingMarketsQuery(take = 20, filter: HubTrendingQueryFilter = {}) {
  return useQuery<HubMarketEnriched[], Error>({
    queryKey: queryKeys.hub.trending(take, filter),
    queryFn: () => fetchHubTrendingMarkets(take, filter),
    staleTime: 45_000,
    refetchOnMount: true,
  });
}
