"use client";

import { useDebouncedTradingRefetchOnFocus } from "../hooks/useDebouncedTradingRefetchOnFocus";
import { usePortfolioRealtimeInvalidation } from "../hooks/usePortfolioRealtimeInvalidation";
import { useWalletOnChainSoftSync } from "../hooks/useWalletOnChainSoftSync";
import { useFeedRealtimeSync } from "./use-feed-realtime-sync";
import { useMarketRealtimeSync } from "./use-market-realtime-sync";

export type UseRealtimeSyncOptions = {
  /** Subscribe to a single market's WS room + invalidate its subtree on each batch. */
  marketId?: string;
  /** Sync portfolio + custodial wallet + on-chain balances for this user. */
  userId?: string;
  /** Trades infinite query scope (default = `"me"`). */
  tradesScope?: string;
  /** Bridge the global activity tape into the markets feed. Default = `true`. */
  syncFeed?: boolean;
  /** ISO timestamp of last on-chain snapshot — used to gate soft re-syncs. */
  onChainSyncedAt?: string | null;
  /**
   * Override debounce windows. Sensible defaults are tuned to absorb 5–10
   * trades per second without thrashing UI.
   */
  debounce?: {
    market?: number;
    portfolio?: number;
    feed?: number;
    focus?: number;
  };
};

/**
 * The single entry point for "wire up realtime on this screen".
 *
 *  - Markets pages → `{ syncFeed: true }`
 *  - Market detail → `{ marketId, userId, syncFeed: false }`
 *  - Portfolio     → `{ userId }`
 *  - Wallet        → `{ userId, onChainSyncedAt }`
 *
 * Behind the scenes this composes:
 *   - {@link useMarketRealtimeSync}    → market subtree
 *   - {@link usePortfolioRealtimeInvalidation} → portfolio + trades infinite
 *   - {@link useDebouncedTradingRefetchOnFocus} → focus reconciliation
 *   - {@link useWalletOnChainSoftSync} → RPC-backed balance refresh
 *   - {@link useFeedRealtimeSync}      → markets-feed invalidation
 */
export function useRealtimeSync({
  marketId,
  userId,
  tradesScope = "me",
  syncFeed = true,
  onChainSyncedAt,
  debounce,
}: UseRealtimeSyncOptions = {}): void {
  // Market subtree (no-op when `marketId` is undefined).
  useMarketRealtimeSync(marketId, { debounceMs: debounce?.market });

  // Portfolio + custodial wallet (no-ops when `userId` is undefined).
  usePortfolioRealtimeInvalidation(
    userId,
    debounce?.portfolio ?? 450,
    tradesScope,
  );
  useDebouncedTradingRefetchOnFocus(
    userId,
    debounce?.focus ?? 600,
    tradesScope,
  );
  useWalletOnChainSoftSync(userId, onChainSyncedAt ?? null);

  // Cross-market activity tape → discovery feed.
  useFeedRealtimeSync({
    disabled: !syncFeed,
    debounceMs: debounce?.feed,
  });
}

export { useMarketRealtimeSync } from "./use-market-realtime-sync";
export { useFeedRealtimeSync } from "./use-feed-realtime-sync";
