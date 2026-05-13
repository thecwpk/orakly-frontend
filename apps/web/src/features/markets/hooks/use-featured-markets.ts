"use client";

import { useMarketsFeedQuery } from "@/shared/api/hooks/useMarketsFeedQuery";

/** @deprecated Prefer `useMarketsFeedQuery` from `@/shared/api`. */
export function useFeaturedMarkets() {
  return useMarketsFeedQuery();
}
