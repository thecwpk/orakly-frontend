"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { CACHE_POLICY } from "../cache-policy";
import { fetchTradesPage } from "../fetchers/trades";
import { queryKeys } from "../query-keys";

const PAGE_SIZE = 40;

export function useTradesInfiniteQuery(userScope: string | undefined) {
  return useInfiniteQuery({
    queryKey:
      userScope ?
        queryKeys.trades.infinite(userScope)
      : [...queryKeys.trades.root(), "__idle"],
    queryFn: ({ pageParam }) =>
      fetchTradesPage({
        take: PAGE_SIZE,
        cursor: pageParam ?? undefined,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled: !!userScope,
    ...CACHE_POLICY.tradesInfinite,
  });
}
