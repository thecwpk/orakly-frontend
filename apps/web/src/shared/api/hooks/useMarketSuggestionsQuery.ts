"use client";

import { useQuery } from "@tanstack/react-query";
import type { MarketSuggestionRow } from "@/shared/contracts/hub-home";
import { fetchMarketSuggestions } from "../fetchers/hub-home";
import { queryKeys } from "../query-keys";

export function useMarketSuggestionsQuery(take = 5) {
  return useQuery<MarketSuggestionRow[], Error>({
    queryKey: queryKeys.hub.suggestions(take),
    queryFn: () => fetchMarketSuggestions(take),
    staleTime: 60_000,
  });
}
