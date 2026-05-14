"use client";

import { useQuery } from "@tanstack/react-query";
import { CACHE_POLICY } from "../cache-policy";
import { fetchMarketVolumeWindowBySlug } from "../fetchers/markets-live";
import { queryKeys } from "../query-keys";

export function useMarketVolumeWindowQuery(slug: string | undefined) {
  return useQuery({
    queryKey:
      slug ? queryKeys.markets.volumeWindowBySlug(slug) : [...queryKeys.markets.root(), "volumeWindow", "__idle"],
    queryFn: () => fetchMarketVolumeWindowBySlug(slug!),
    enabled: !!slug,
    ...CACHE_POLICY.marketVolumeWindow,
  });
}
