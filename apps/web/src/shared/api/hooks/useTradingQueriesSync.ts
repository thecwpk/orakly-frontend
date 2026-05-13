"use client";

import { useDebouncedTradingRefetchOnFocus } from "./useDebouncedTradingRefetchOnFocus";
import { usePortfolioRealtimeInvalidation } from "./usePortfolioRealtimeInvalidation";
import { useWalletOnChainSoftSync } from "./useWalletOnChainSoftSync";

/** Opinionated bundle: realtime pushes + debounced focus reconciliation for one user id. */
export function useTradingQueriesSync(
  userId: string | undefined,
  tradesScope: string = "me",
  options?: { onChainSyncedAt?: string | null },
) {
  usePortfolioRealtimeInvalidation(userId, 450, tradesScope);
  useDebouncedTradingRefetchOnFocus(userId, 600, tradesScope);
  useWalletOnChainSoftSync(userId, options?.onChainSyncedAt);
}
