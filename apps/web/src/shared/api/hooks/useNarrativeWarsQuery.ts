"use client";

import { useQuery } from "@tanstack/react-query";
import type { NarrativeWarCard } from "@/shared/contracts/hub-home";
import { fetchNarrativeWars } from "../fetchers/hub-home";
import { queryKeys } from "../query-keys";

export function useNarrativeWarsQuery() {
  return useQuery<NarrativeWarCard[], Error>({
    queryKey: queryKeys.hub.narrativeWars(),
    queryFn: fetchNarrativeWars,
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
}
