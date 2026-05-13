"use client";

import { useEffect } from "react";
import {
  useQueryClient,
  type QueryKey,
  type QueryState,
} from "@tanstack/react-query";

export type UseStaleWhileRevalidateOptions = {
  /** The query key to nudge when a component mounts and the cache is stale. */
  queryKey: QueryKey;
  /**
   * Maximum age (in ms) before the cache is considered stale enough to
   * trigger a background refetch. Default = 60s.
   */
  maxAgeMs?: number;
  /** Skip the nudge entirely (e.g. when the data isn't ready yet). */
  disabled?: boolean;
};

type CacheState<T = unknown> = QueryState<T> & {
  dataUpdatedAt: number;
};

/**
 * "Stale-while-revalidate" trigger for screens that *prefer* the cached value
 * but should quietly refresh it after some age threshold (e.g. opening a
 * portfolio page where last week's data is OK to render but should be
 * brought up to date silently).
 *
 * This is intentionally lighter than `refetchInterval` because:
 *   - it fires *once per mount* (no continual polling)
 *   - it only fires when the cache is genuinely stale by age, not on every
 *     `staleTime` boundary
 *
 * Pair with `keepPreviousData` for zero-flash UX during the refetch.
 */
export function useStaleWhileRevalidate({
  queryKey,
  maxAgeMs = 60_000,
  disabled = false,
}: UseStaleWhileRevalidateOptions): void {
  const qc = useQueryClient();

  useEffect(() => {
    if (disabled) return;

    const state = qc.getQueryState<unknown>(queryKey) as CacheState | undefined;
    if (!state) return;

    const updatedAt = state.dataUpdatedAt ?? 0;
    if (updatedAt === 0) return;

    const age = Date.now() - updatedAt;
    if (age <= maxAgeMs) return;

    void qc.invalidateQueries({ queryKey });
    // Intentionally not depending on the array identity of `queryKey` to
    // avoid re-firing on every render; we re-evaluate when its serialised
    // shape changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled, JSON.stringify(queryKey), maxAgeMs, qc]);
}
