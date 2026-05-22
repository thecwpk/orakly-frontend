"use client";

import { useQuery } from "@tanstack/react-query";
import { CACHE_POLICY } from "../cache-policy";
import type { HubMarketsPreviewPayload } from "@/shared/contracts/hub-markets-preview";
import { fetchHubMarketsPreview } from "../fetchers/hub-markets-preview";
import { queryKeys } from "../query-keys";

export type UseHubMarketsPreviewQueryParams = {
  enabled?: boolean;
};

export function useHubMarketsPreviewQuery(params?: UseHubMarketsPreviewQueryParams) {
  const { enabled = true } = params ?? {};
  return useQuery<HubMarketsPreviewPayload, Error>({
    queryKey: queryKeys.markets.hubPreview(),
    queryFn: fetchHubMarketsPreview,
    enabled,
    ...CACHE_POLICY.marketsFeed,
  });
}
