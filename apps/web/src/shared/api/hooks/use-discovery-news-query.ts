"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchDiscoveryNews, type DiscoveryNewsPayload } from "../fetchers/discovery-news";
import { queryKeys } from "../query-keys";
import { withTier } from "../cache-policy";

export function useDiscoveryNewsQuery(
  q: string,
  options?: { enabled?: boolean },
) {
  const extraEnabled = options?.enabled ?? true;
  const key = q.trim().slice(0, 280) || "cryptocurrency markets";
  return useQuery<DiscoveryNewsPayload>({
    queryKey: queryKeys.discovery.news(key),
    queryFn: () => fetchDiscoveryNews(key),
    enabled: key.length > 0 && extraEnabled,
    ...withTier("warm", {
      /** Headlines are slow third-party calls — treat as soft cache, no timer refetch. */
      staleTime: 10 * 60_000,
      refetchInterval: false,
      refetchOnWindowFocus: false,
    }),
  });
}
