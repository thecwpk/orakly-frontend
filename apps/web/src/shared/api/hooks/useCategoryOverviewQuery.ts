"use client";

import { useQuery } from "@tanstack/react-query";
import type { CategoryOverviewRow } from "@/shared/contracts/hub-home";
import { fetchCategoriesOverview } from "../fetchers/hub-home";
import { CACHE_POLICY } from "../cache-policy";
import { queryKeys } from "../query-keys";

export function useCategoryOverviewQuery() {
  return useQuery<CategoryOverviewRow[], Error>({
    queryKey: queryKeys.hub.categories(),
    queryFn: fetchCategoriesOverview,
    ...CACHE_POLICY.categories,
    refetchOnMount: true,
  });
}
