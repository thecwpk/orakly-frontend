"use client";

import { useQuery } from "@tanstack/react-query";
import { CACHE_POLICY } from "../cache-policy";
import { fetchPortfolio } from "../fetchers/portfolio";
import { queryKeys } from "../query-keys";

export function usePortfolioQuery(userId: string | undefined) {
  return useQuery({
    queryKey:
      userId ?
        queryKeys.portfolio.byUser(userId)
      : [...queryKeys.portfolio.root(), "__idle"],
    queryFn: () => fetchPortfolio(userId),
    enabled: !!userId,
    ...CACHE_POLICY.portfolio,
  });
}
