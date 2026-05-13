"use client";

import { useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { debounceAsyncFn } from "../debounce";
import { queryKeys } from "../query-keys";

/**
 * When realtime batches advance (`seq`), softly reconcile HTTP odds without thrashing UI.
 */
export function useMarketOddsRealtimeInvalidation(
  marketId: string | undefined,
  batchSeq: number,
  debounceMs = 380,
) {
  const qc = useQueryClient();

  const debounced = useMemo(
    () =>
      debounceAsyncFn(() => {
        if (!marketId) return;
        void qc.invalidateQueries({ queryKey: queryKeys.markets.odds(marketId) });
      }, debounceMs),
    [qc, marketId, debounceMs],
  );

  useEffect(() => {
    if (!marketId || batchSeq <= 0) return;
    debounced();
    return () => debounced.cancel();
  }, [batchSeq, marketId, debounced]);
}
