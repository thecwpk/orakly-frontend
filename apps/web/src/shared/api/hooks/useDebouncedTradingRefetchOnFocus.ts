"use client";

import { useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { debounceAsyncFn } from "../debounce";
import { queryKeys } from "../query-keys";

/**
 * Focus / visibility-driven debounced refetch for trading-critical queries only.
 */
export function useDebouncedTradingRefetchOnFocus(
  userId: string | undefined,
  debounceMs = 600,
  tradesScope: string = "me",
) {
  const qc = useQueryClient();

  const flush = useMemo(
    () =>
      debounceAsyncFn(() => {
        if (!userId) return;
        void qc.invalidateQueries({ queryKey: queryKeys.portfolio.byUser(userId) });
        void qc.invalidateQueries({ queryKey: queryKeys.trades.infinite(tradesScope) });
      }, debounceMs),
    [qc, userId, debounceMs, tradesScope],
  );

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") flush();
    };
    window.addEventListener("focus", flush);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("focus", flush);
      document.removeEventListener("visibilitychange", onVis);
      flush.cancel();
    };
  }, [flush]);
}
