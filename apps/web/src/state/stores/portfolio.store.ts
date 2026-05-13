"use client";

import { create } from "zustand";
import { devtools, subscribeWithSelector } from "zustand/middleware";
import { devtoolsConfig } from "../lib/devtools";

/**
 * Client-only coordination layer over the React Query portfolio cache.
 *
 * The portfolio *itself* (positions, balance, equity history) is server state
 * fetched via `usePortfolioQuery` — it lives in React Query, not here.
 *
 * This store carries:
 *  - `optimisticBalanceDeltaUsd` — applied while a trade is in flight, cleared
 *    after settle/refetch,
 *  - `optimisticPositionDeltas` — pending size changes per market, used by
 *    the trading desk to render the post-trade position before the server
 *    confirms,
 *  - `lastSyncedAt` — most recent successful portfolio refetch timestamp,
 *  - `serverGeneration` — monotonic counter bumped by Socket.IO portfolio
 *    refresh events; mirrors `portfolio-generation-store` for UI consumption.
 *
 * Never persisted — it always rehydrates from the server on mount.
 */

export type OptimisticPositionDelta = {
  marketId: string;
  outcome: "YES" | "NO";
  /** Signed share quantity delta (positive = bought, negative = sold). */
  sharesDelta: number;
  /** USD impact on cash balance (negative = debited, positive = credited). */
  cashDeltaUsd: number;
  /** ms — used to expire stale optimistic deltas if the server never confirms. */
  at: number;
};

export type PortfolioState = {
  optimisticBalanceDeltaUsd: number;
  optimisticPositionDeltas: Record<string, OptimisticPositionDelta>;
  lastSyncedAt: number | null;
  /** Monotonic counter — bumped on each portfolio Socket.IO refresh event. */
  serverGeneration: number;
  /** True while a manual refresh is mid-flight (query hook should set this). */
  isRefreshing: boolean;
};

export type PortfolioActions = {
  applyOptimistic: (delta: OptimisticPositionDelta) => void;
  clearOptimistic: (marketId: string, outcome: "YES" | "NO") => void;
  clearAllOptimistic: () => void;
  markSynced: () => void;
  bumpGeneration: () => void;
  setRefreshing: (refreshing: boolean) => void;
  reset: () => void;
};

export type PortfolioStore = PortfolioState & PortfolioActions;

const INITIAL_STATE: PortfolioState = {
  optimisticBalanceDeltaUsd: 0,
  optimisticPositionDeltas: {},
  lastSyncedAt: null,
  serverGeneration: 0,
  isRefreshing: false,
};

const optimisticKey = (marketId: string, outcome: "YES" | "NO") =>
  `${marketId}::${outcome}`;

/** Defensive: drop stale optimistic deltas older than this. */
const OPTIMISTIC_TTL_MS = 30_000;

function pruneStale(
  next: Record<string, OptimisticPositionDelta>,
): Record<string, OptimisticPositionDelta> {
  const now = Date.now();
  const out: Record<string, OptimisticPositionDelta> = {};
  for (const [k, v] of Object.entries(next)) {
    if (now - v.at <= OPTIMISTIC_TTL_MS) out[k] = v;
  }
  return out;
}

export const usePortfolioStore = create<PortfolioStore>()(
  devtools(
    subscribeWithSelector((set) => ({
      ...INITIAL_STATE,

      applyOptimistic: (delta) =>
        set(
          (s) => {
            const key = optimisticKey(delta.marketId, delta.outcome);
            const cleaned = pruneStale(s.optimisticPositionDeltas);
            const next = { ...cleaned, [key]: delta };
            const cash = Object.values(next).reduce(
              (acc, d) => acc + d.cashDeltaUsd,
              0,
            );
            return {
              optimisticPositionDeltas: next,
              optimisticBalanceDeltaUsd: cash,
            };
          },
          false,
          "portfolio/applyOptimistic",
        ),

      clearOptimistic: (marketId, outcome) =>
        set(
          (s) => {
            const key = optimisticKey(marketId, outcome);
            if (!(key in s.optimisticPositionDeltas)) return s;
            const next = { ...s.optimisticPositionDeltas };
            delete next[key];
            const cash = Object.values(next).reduce(
              (acc, d) => acc + d.cashDeltaUsd,
              0,
            );
            return {
              optimisticPositionDeltas: next,
              optimisticBalanceDeltaUsd: cash,
            };
          },
          false,
          "portfolio/clearOptimistic",
        ),

      clearAllOptimistic: () =>
        set(
          {
            optimisticPositionDeltas: {},
            optimisticBalanceDeltaUsd: 0,
          },
          false,
          "portfolio/clearAllOptimistic",
        ),

      markSynced: () =>
        set(
          { lastSyncedAt: Date.now(), isRefreshing: false },
          false,
          "portfolio/markSynced",
        ),

      bumpGeneration: () =>
        set(
          (s) => ({ serverGeneration: s.serverGeneration + 1 }),
          false,
          "portfolio/bumpGeneration",
        ),

      setRefreshing: (isRefreshing) =>
        set({ isRefreshing }, false, "portfolio/setRefreshing"),

      reset: () => set({ ...INITIAL_STATE }, false, "portfolio/reset"),
    })),
    devtoolsConfig("portfolio"),
  ),
);

export function getPortfolioSnapshot(): Readonly<PortfolioState> {
  return usePortfolioStore.getState();
}
