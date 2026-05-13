"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";

type Options = {
  /** When true, calling `loadMore` is allowed. */
  hasMore: boolean;
  /** Called when the sentinel intersects. Should be idempotent / debounced. */
  onLoadMore: () => void;
  /** rootMargin for the IntersectionObserver. Defaults to a generous prefetch zone. */
  rootMargin?: string;
  /** Minimum delay between trigger fires (ms). */
  cooldownMs?: number;
  /** Disable observation entirely (e.g. when loading or errored). */
  disabled?: boolean;
};

/**
 * Returns a sentinel ref + a manual `trigger`. Mount the sentinel just below
 * the bottom of the list; when it scrolls into the prefetch zone, `onLoadMore`
 * fires (rate-limited by `cooldownMs`).
 *
 * Falls back gracefully on environments without IntersectionObserver — in
 * that case, callers can still drive pagination via the manual `trigger`.
 */
export function useInfiniteScroll<T extends HTMLElement = HTMLDivElement>({
  hasMore,
  onLoadMore,
  rootMargin = "0px 0px 600px 0px",
  cooldownMs = 250,
  disabled = false,
}: Options): { sentinelRef: RefObject<T | null>; trigger: () => void } {
  const sentinelRef = useRef<T | null>(null);
  const lastFiredAt = useRef<number>(0);

  const fire = useCallback(() => {
    if (disabled || !hasMore) return;
    const now = performance.now();
    if (now - lastFiredAt.current < cooldownMs) return;
    lastFiredAt.current = now;
    onLoadMore();
  }, [cooldownMs, disabled, hasMore, onLoadMore]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") return;
    if (disabled || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) fire();
        }
      },
      { rootMargin, threshold: 0 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [disabled, fire, hasMore, rootMargin]);

  return { sentinelRef, trigger: fire };
}

/**
 * Local-array pagination helper — wraps the entire dataset and exposes a
 * `visible` slice that grows by `pageSize` on each `loadMore` call. Resets
 * automatically when the dataset reference changes (e.g. filter/sort flip).
 */
export function usePagedSlice<T>(
  data: ReadonlyArray<T>,
  pageSize: number = 24,
): {
  visible: ReadonlyArray<T>;
  hasMore: boolean;
  loadMore: () => void;
  reset: () => void;
} {
  const [page, setPage] = useState<number>(1);

  // Reset when the dataset identity changes (filters changed -> new array)
  useEffect(() => {
    setPage(1);
  }, [data]);

  const total = data.length;
  const visibleCount = Math.min(total, page * pageSize);
  const visible = data.slice(0, visibleCount);
  const hasMore = visibleCount < total;

  const loadMore = useCallback(() => {
    setPage((p) => p + 1);
  }, []);

  const reset = useCallback(() => setPage(1), []);

  return { visible, hasMore, loadMore, reset };
}
