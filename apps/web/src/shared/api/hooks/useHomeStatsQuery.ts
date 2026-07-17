"use client";

import { useQuery } from "@tanstack/react-query";
import type { HomeStatsPayload } from "@/shared/contracts/hub-home";
import { fetchHomeStats } from "../fetchers/hub-home";
import { queryKeys } from "../query-keys";

export function useHomeStatsQuery() {
  return useQuery<HomeStatsPayload, Error>({
    queryKey: queryKeys.hub.stats(),
    queryFn: fetchHomeStats,
    staleTime: 45_000,
    refetchInterval: 60_000,
    retry: 1,
  });
}
