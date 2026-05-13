"use client";

import { useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usePortfolioRealtimeTick } from "@/websocket/hooks/usePortfolioRealtimeTick";
import { debounceAsyncFn } from "../debounce";
import { queryKeys } from "../query-keys";

/**
 * Bridges Socket.IO `portfolio:refresh` → debounced invalidation (bursts collapse to one refetch wave).
 */
export function usePortfolioRealtimeInvalidation(
  userId: string | undefined,
  debounceMs = 450,
  tradesScope: string = "me",
) {
  const qc = useQueryClient();
  const tick = usePortfolioRealtimeTick(userId);

  const debounced = useMemo(
    () =>
      debounceAsyncFn(() => {
        if (!userId) return;
        void qc.invalidateQueries({ queryKey: queryKeys.portfolio.byUser(userId) });
        void qc.invalidateQueries({ queryKey: queryKeys.trades.infinite(tradesScope) });
      }, debounceMs),
    [qc, userId, debounceMs, tradesScope],
  );

  useEffect(() => {
    if (!userId || tick === 0) return;
    debounced();
    return () => debounced.cancel();
  }, [tick, userId, debounced]);
}
