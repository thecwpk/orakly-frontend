"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { CACHE_POLICY } from "../cache-policy";
import {
  fetchMarketsFeedScoped,
  type MarketsFeedScopedParams,
} from "../fetchers/markets-feed";
import { queryKeys } from "../query-keys";

export type UseMarketsFeedScopedQueryParams = MarketsFeedScopedParams & {
  enabled?: boolean;
};

export function resolveMarketsScopedTake(params: MarketsFeedScopedParams): number {
  if (params.take !== undefined) return params.take;
  if (params.lane === "directory") return 120;
  if (params.scope === "hub") {
    if (params.lane === "alpha") return 12;
    return 20;
  }
  return 60;
}

export function useMarketsFeedScopedQuery(params: UseMarketsFeedScopedQueryParams) {
  const { enabled = true, ...scopedParams } = params;
  const trendingBy =
    scopedParams.lane === "trending"
      ? (scopedParams.trendingBy ?? "volume")
      : "";
  const filter =
    scopedParams.lane === "list" ? (scopedParams.filter ?? "all") : "";
  const take = resolveMarketsScopedTake(scopedParams);

  return useQuery({
    queryKey: queryKeys.markets.feedScoped({
      scope: scopedParams.scope,
      lane: scopedParams.lane,
      trendingBy,
      filter,
      take,
    }),
    queryFn: () =>
      fetchMarketsFeedScoped({
        ...scopedParams,
        trendingBy:
          scopedParams.lane === "trending"
            ? (scopedParams.trendingBy ?? "volume")
            : undefined,
        filter:
          scopedParams.lane === "list"
            ? (scopedParams.filter ?? "all")
            : undefined,
        take,
      }),
    placeholderData: keepPreviousData,
    enabled,
    ...CACHE_POLICY.marketsFeed,
  });
}
