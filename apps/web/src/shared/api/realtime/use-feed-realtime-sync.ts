"use client";

import { useEffect, useMemo, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLiveActivityFeed } from "@/websocket/hooks/useLiveActivityFeed";
import { debounceAsyncFn } from "../debounce";
import { invalidateMarketsFeed } from "../invalidate";
import { queryKeys } from "../query-keys";

export type UseFeedRealtimeSyncOptions = {
  /** Debounce window before invalidating the feed query. */
  debounceMs?: number;
  /** Also invalidate the activity ledger pages. Default = `false`. */
  invalidateActivity?: boolean;
  /** Disable entirely (e.g. when the user is typing a quote and we don't want jitter). */
  disabled?: boolean;
};

/**
 * Bridges the global Socket.IO activity tape into the markets-feed cache.
 *
 * When the WS feed receives a new event, we debounce-invalidate
 * `queryKeys.markets.feed()` so the discovery list quietly refreshes its
 * `volume24h`, last trade timestamp, and other derived fields. Optionally
 * cascades into the `activity` namespace for ledger pages.
 *
 * The hook tracks the *length* of the in-memory ring buffer rather than
 * subscribing to deep equality, so unrelated re-renders are skipped.
 */
export function useFeedRealtimeSync({
  debounceMs = 600,
  invalidateActivity = false,
  disabled = false,
}: UseFeedRealtimeSyncOptions = {}): void {
  const qc = useQueryClient();
  const feed = useLiveActivityFeed();
  const lastSize = useRef<number>(feed.length);

  const debounced = useMemo(
    () =>
      debounceAsyncFn(() => {
        invalidateMarketsFeed(qc);
        if (invalidateActivity) {
          void qc.invalidateQueries({ queryKey: queryKeys.activity.root() });
        }
      }, debounceMs),
    [debounceMs, invalidateActivity, qc],
  );

  useEffect(() => {
    if (disabled) return;
    if (feed.length === lastSize.current) return;
    lastSize.current = feed.length;
    debounced();
    return () => debounced.cancel();
  }, [debounced, disabled, feed.length]);
}
