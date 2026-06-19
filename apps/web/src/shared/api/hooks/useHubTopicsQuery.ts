"use client";

import { useQuery } from "@tanstack/react-query";
import type { HubTopicChip } from "@/shared/contracts/hub-home";
import { fetchHubTopicChips } from "../fetchers/hub-home";
import { queryKeys } from "../query-keys";

/** Dynamic hub chips — narrative engine + breaking; polls with attention cadence. */
export function useHubTopicsQuery() {
  return useQuery<HubTopicChip[], Error>({
    queryKey: queryKeys.hub.topics(),
    queryFn: fetchHubTopicChips,
    staleTime: 45_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
}
