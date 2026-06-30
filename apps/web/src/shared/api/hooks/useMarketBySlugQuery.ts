"use client";

import { useQuery } from "@tanstack/react-query";
import { withTier } from "../cache-policy";
import { fetchMarketBySlug } from "../fetchers/markets-live";
import { queryKeys } from "../query-keys";

/** Detail page — short staleness so admin on-chain deploy is visible without hard refresh. */
export function useMarketBySlugQuery(slug: string | undefined) {
  return useQuery({
    queryKey: queryKeys.markets.bySlug(slug ?? ""),
    queryFn: () => fetchMarketBySlug(slug!),
    enabled: Boolean(slug?.trim()),
    ...withTier("warm", { staleTime: 10_000, refetchOnMount: true }),
  });
}
