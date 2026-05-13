"use client";

import { useCallback } from "react";
import {
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { CACHE_POLICY } from "./cache-policy";
import { fetchMarketsFeed } from "./fetchers/markets-feed";
import { fetchMarketOdds } from "./fetchers/markets-live";
import { fetchPortfolio } from "./fetchers/portfolio";
import { queryKeys } from "./query-keys";

/* ---------------------------------------------------------------- */
/* Imperative prefetch (use from event handlers / router transitions) */
/* ---------------------------------------------------------------- */

export async function prefetchMarketsFeed(qc: QueryClient): Promise<void> {
  await qc.prefetchQuery({
    queryKey: queryKeys.markets.feed(),
    queryFn: fetchMarketsFeed,
    staleTime: CACHE_POLICY.marketsFeed.staleTime,
  });
}

export async function prefetchMarketOdds(
  qc: QueryClient,
  marketId: string,
): Promise<void> {
  await qc.prefetchQuery({
    queryKey: queryKeys.markets.odds(marketId),
    queryFn: () => fetchMarketOdds(marketId),
    staleTime: CACHE_POLICY.marketOdds.staleTime,
  });
}

export async function prefetchPortfolio(
  qc: QueryClient,
  userId: string,
): Promise<void> {
  await qc.prefetchQuery({
    queryKey: queryKeys.portfolio.byUser(userId),
    queryFn: fetchPortfolio,
    staleTime: CACHE_POLICY.portfolio.staleTime,
  });
}

/* ---------------------------------------------------------------- */
/* Hook variants — return stable callbacks for hover prefetch         */
/* ---------------------------------------------------------------- */

/**
 * Returns a stable callback that warms the cache for a market's odds.
 *
 * Wire this to `onMouseEnter` / `onFocus` on `<Link>` cards so the detail
 * page hydrates instantly when the user clicks through:
 *
 * ```tsx
 * const prefetch = usePrefetchMarketOdds();
 * <Link href={`/markets/${slug}`} onMouseEnter={() => prefetch(id)} />;
 * ```
 */
export function usePrefetchMarketOdds(): (marketId: string) => void {
  const qc = useQueryClient();
  return useCallback(
    (marketId: string) => {
      if (!marketId) return;
      const existing = qc.getQueryState(queryKeys.markets.odds(marketId));
      if (existing?.dataUpdatedAt && Date.now() - existing.dataUpdatedAt < 30_000) {
        return; // already warm
      }
      void prefetchMarketOdds(qc, marketId);
    },
    [qc],
  );
}

/** Idempotent prefetch of the discovery feed — safe to call from <Link hover>. */
export function usePrefetchMarketsFeed(): () => void {
  const qc = useQueryClient();
  return useCallback(() => {
    const existing = qc.getQueryState(queryKeys.markets.feed());
    if (existing?.dataUpdatedAt && Date.now() - existing.dataUpdatedAt < 60_000) {
      return;
    }
    void prefetchMarketsFeed(qc);
  }, [qc]);
}

/** Warm portfolio cache when `userId` is known (e.g. hover on Portfolio nav). */
export function usePrefetchPortfolio(userId: string | undefined): () => void {
  const qc = useQueryClient();
  return useCallback(() => {
    if (!userId) return;
    const existing = qc.getQueryState(queryKeys.portfolio.byUser(userId));
    if (existing?.dataUpdatedAt && Date.now() - existing.dataUpdatedAt < 45_000) {
      return;
    }
    void prefetchPortfolio(qc, userId);
  }, [qc, userId]);
}
