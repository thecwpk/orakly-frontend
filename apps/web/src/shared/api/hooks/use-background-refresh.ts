"use client";

import { useEffect, useMemo } from "react";
import {
  useQueryClient,
  type QueryFilters,
  type QueryKey,
} from "@tanstack/react-query";
import { debounceAsyncFn } from "../debounce";

type Target = QueryKey | QueryFilters;

export type UseBackgroundRefreshOptions = {
  /**
   * Targets to invalidate. Either a `queryKey` array or a full `QueryFilters`
   * object (predicate, etc.). Multiple targets are batched into a single
   * debounced burst.
   */
  targets: ReadonlyArray<Target>;
  /** Re-fetch cadence in ms. Default = 60s. */
  intervalMs?: number;
  /** Disable observation entirely. */
  disabled?: boolean;
  /**
   * Pause the interval when the document is hidden. Default = `true`.
   * Combined with the `online` listener, this prevents wasted refetches
   * when the user is on another tab or offline.
   */
  pauseWhenHidden?: boolean;
  /** Also re-fetch on `window.focus`. Default = `true`. */
  refetchOnFocus?: boolean;
  /** Also re-fetch when the connection comes back online. Default = `true`. */
  refetchOnReconnect?: boolean;
  /** Trailing debounce window for bursty triggers (ms). */
  debounceMs?: number;
};

const isFilters = (t: Target): t is QueryFilters =>
  !Array.isArray(t) && typeof t === "object" && t !== null;

/**
 * Visibility / online-aware background refresh primitive.
 *
 * Use this on long-lived screens where data should stay reasonably fresh
 * but you don't want React Query's per-query `refetchInterval` (e.g. when
 * many queries on the same page should all reconcile in one batched wave
 * after focus returns). The hook coalesces noisy triggers into a single
 * debounced flush.
 */
export function useBackgroundRefresh({
  targets,
  intervalMs = 60_000,
  disabled = false,
  pauseWhenHidden = true,
  refetchOnFocus = true,
  refetchOnReconnect = true,
  debounceMs = 250,
}: UseBackgroundRefreshOptions): void {
  const qc = useQueryClient();

  const flush = useMemo(
    () =>
      debounceAsyncFn(() => {
        for (const t of targets) {
          if (isFilters(t)) {
            void qc.invalidateQueries(t);
          } else {
            void qc.invalidateQueries({ queryKey: t });
          }
        }
      }, debounceMs),
    [debounceMs, qc, targets],
  );

  useEffect(() => {
    if (disabled) return;
    if (typeof window === "undefined") return;

    let timer: ReturnType<typeof setInterval> | undefined;

    const tick = () => {
      if (pauseWhenHidden && document.visibilityState !== "visible") return;
      flush();
    };

    const start = () => {
      if (timer != null) return;
      timer = setInterval(tick, intervalMs);
    };

    const stop = () => {
      if (timer != null) {
        clearInterval(timer);
        timer = undefined;
      }
    };

    const onFocus = () => {
      if (refetchOnFocus) flush();
    };

    const onVis = () => {
      if (document.visibilityState === "visible") {
        if (refetchOnFocus) flush();
        start();
      } else if (pauseWhenHidden) {
        stop();
      }
    };

    const onOnline = () => {
      if (refetchOnReconnect) flush();
    };

    if (
      pauseWhenHidden &&
      typeof document !== "undefined" &&
      document.visibilityState !== "visible"
    ) {
      // Don't start the interval until the tab is visible again.
    } else {
      start();
    }

    window.addEventListener("focus", onFocus);
    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVis);

    return () => {
      stop();
      flush.cancel();
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [
    disabled,
    flush,
    intervalMs,
    pauseWhenHidden,
    refetchOnFocus,
    refetchOnReconnect,
  ]);
}
