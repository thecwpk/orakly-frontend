"use client";

import { useCallback, useEffect, useRef, type RefObject } from "react";
import type {
  InfiniteData,
  UseInfiniteQueryResult,
} from "@tanstack/react-query";

type ObservableTarget = Element | null | undefined;

export type UseInfiniteScrollSentinelOptions<TData = unknown, TError = Error> = {
  /** The result of `useInfiniteQuery` whose `fetchNextPage` we should drive. */
  query: UseInfiniteQueryResult<InfiniteData<TData>, TError>;
  /**
   * IntersectionObserver `rootMargin`. Default = a 600px prefetch zone below the
   * sentinel so users never see a "loading more" spinner when scrolling fast.
   */
  rootMargin?: string;
  /** Minimum delay between fires (ms). */
  cooldownMs?: number;
  /** Disable observation entirely. */
  disabled?: boolean;
};

/**
 * Sentinel-driven `fetchNextPage` for any `useInfiniteQuery`.
 *
 * Mount the returned `<div ref={sentinelRef} />` just *below* the visible list:
 *
 * ```tsx
 * const trades = useTradesInfiniteQuery(userId);
 * const { sentinelRef } = useInfiniteScrollSentinel({ query: trades });
 *
 * return (
 *   <>
 *     {flat.map(t => <Row key={t.id} t={t} />)}
 *     <div ref={sentinelRef} className="h-px" />
 *   </>
 * );
 * ```
 *
 * Internally the hook:
 *   1. Skips firing when there is no next page or one is already in flight.
 *   2. Cools down between fires to absorb scroll-burst intersection callbacks.
 *   3. Disconnects the observer on unmount + when `disabled` flips.
 */
export function useInfiniteScrollSentinel<TData, TError = Error>({
  query,
  rootMargin = "0px 0px 600px 0px",
  cooldownMs = 250,
  disabled = false,
}: UseInfiniteScrollSentinelOptions<TData, TError>): {
  sentinelRef: RefObject<HTMLDivElement | null>;
  /** Manually trigger the next page (e.g. from a "Load more" button). */
  trigger: () => void;
} {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const lastFiredAt = useRef<number>(0);

  const trigger = useCallback(() => {
    if (disabled) return;
    if (!query.hasNextPage) return;
    if (query.isFetchingNextPage) return;
    const now =
      typeof performance !== "undefined" ? performance.now() : Date.now();
    if (now - lastFiredAt.current < cooldownMs) return;
    lastFiredAt.current = now;
    void query.fetchNextPage();
  }, [cooldownMs, disabled, query]);

  useEffect(() => {
    const node: ObservableTarget = sentinelRef.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") return;
    if (disabled || !query.hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) trigger();
        }
      },
      { rootMargin, threshold: 0 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [disabled, query.hasNextPage, rootMargin, trigger]);

  return { sentinelRef, trigger };
}
