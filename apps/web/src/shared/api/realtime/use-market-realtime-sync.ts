"use client";

import { useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useMarketRealtime } from "@/websocket/hooks/useMarketRealtime";
import { useMarketRoom } from "@/websocket/socket-registry";
import { debounceAsyncFn } from "../debounce";
import { invalidateMarketsFeed } from "../invalidate";
import { marketSubtreeFilter } from "../query-keys";

export type UseMarketRealtimeSyncOptions = {
  /** Subscribe the underlying Socket.IO room (default = `true`). */
  subscribeRoom?: boolean;
  /** Debounce window before invalidating odds-derived queries. */
  debounceMs?: number;
  /** Also invalidate the global feed when a market batch arrives. */
  invalidateFeed?: boolean;
};

/**
 * One-stop composite for "this page cares about live market data":
 *   1. Subscribes the Socket.IO market room for the lifetime of the hook.
 *   2. Reads the realtime snapshot's `seq` (advances per WS batch).
 *   3. Debounces invalidation of every market-derived query (odds/quote/orderBook).
 *
 * Pair with `useMarketOddsQuery` / `useMarketQuoteDebouncedQuery` to get
 * fresh HTTP snapshots after each WS batch without thrashing the UI.
 */
export function useMarketRealtimeSync(
  marketId: string | undefined,
  {
    subscribeRoom = true,
    debounceMs = 380,
    invalidateFeed = false,
  }: UseMarketRealtimeSyncOptions = {},
): { seq: number } {
  const qc = useQueryClient();
  const rt = useMarketRealtime(marketId);

  // Subscribe the WS room. The hook is no-op when `marketId` is undefined
  // and respects the `subscribeRoom` flag for advanced cases (preview pages).
  useMarketRoom(subscribeRoom ? marketId : undefined);

  const debounced = useMemo(
    () =>
      debounceAsyncFn(() => {
        if (!marketId) return;
        void qc.invalidateQueries(marketSubtreeFilter(marketId));
        if (invalidateFeed) {
          invalidateMarketsFeed(qc);
        }
      }, debounceMs),
    [debounceMs, invalidateFeed, marketId, qc],
  );

  useEffect(() => {
    if (!marketId || rt.seq <= 0) return;
    debounced();
    return () => debounced.cancel();
  }, [debounced, marketId, rt.seq]);

  return { seq: rt.seq };
}
