"use client";

import { useQuery } from "@tanstack/react-query";
import type { HubMarketEnriched } from "@/shared/contracts/hub-home";
import { fetchConvictionMarkets } from "../fetchers/hub-home";
import { queryKeys } from "../query-keys";

export function useConvictionMarketsQuery(take = 6) {
  return useQuery<HubMarketEnriched[], Error>({
    queryKey: queryKeys.hub.conviction(take),
    queryFn: () => fetchConvictionMarkets(take),
    staleTime: 45_000,
  });
}
