"use client";

import { useQuery } from "@tanstack/react-query";
import type { CreatorProfileStats } from "@/shared/contracts/creator-profile";
import { fetchCreatorStats } from "../fetchers/creator-profile";
import { queryKeys } from "../query-keys";

export function useCreatorStatsQuery(address: string) {
  const normalized = address.trim().toLowerCase();

  return useQuery<CreatorProfileStats, Error>({
    queryKey: queryKeys.profile.creatorStats(normalized),
    queryFn: () => fetchCreatorStats(normalized),
    enabled: /^0x[a-f0-9]{40}$/.test(normalized),
    staleTime: 60_000,
  });
}
