"use client";

import { useQuery } from "@tanstack/react-query";
import { CACHE_POLICY } from "../cache-policy";
import { fetchMarketBySlug } from "../fetchers/markets-live";
import { queryKeys } from "../query-keys";

export function useMarketBySlugQuery(slug: string | undefined) {
  return useQuery({
    queryKey: queryKeys.markets.bySlug(slug ?? ""),
    queryFn: () => fetchMarketBySlug(slug!),
    enabled: Boolean(slug?.trim()),
    ...CACHE_POLICY.marketsFeed,
  });
}
