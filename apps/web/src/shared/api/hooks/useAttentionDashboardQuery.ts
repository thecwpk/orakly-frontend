"use client";

import { useQuery } from "@tanstack/react-query";
import type { AttentionNarrativeRow } from "@/shared/contracts/hub-home";
import { fetchAttentionDashboard } from "../fetchers/hub-home";
import { queryKeys } from "../query-keys";

export function useAttentionDashboardQuery() {
  return useQuery<AttentionNarrativeRow[], Error>({
    queryKey: queryKeys.hub.attention(),
    queryFn: fetchAttentionDashboard,
    staleTime: 45_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
}
