import { useShallow } from "../lib/shallow";
import {
  usePortfolioStore,
  type OptimisticPositionDelta,
  type PortfolioStore,
} from "../stores/portfolio.store";

/* Primitive selectors */

export const useOptimisticBalanceDelta = (): number =>
  usePortfolioStore((s) => s.optimisticBalanceDeltaUsd);

export const usePortfolioGeneration = (): number =>
  usePortfolioStore((s) => s.serverGeneration);

export const usePortfolioLastSyncedAt = (): number | null =>
  usePortfolioStore((s) => s.lastSyncedAt);

export const usePortfolioRefreshing = (): boolean =>
  usePortfolioStore((s) => s.isRefreshing);

export const useHasPendingOptimistic = (): boolean =>
  usePortfolioStore(
    (s) => Object.keys(s.optimisticPositionDeltas).length > 0,
  );

/**
 * Parametrized primitive selector — returns the *signed* shares delta for a
 * (marketId, outcome) pair, or `0` if none. Returning a number keeps re-renders
 * tightly bounded.
 */
export const useOptimisticSharesDelta = (
  marketId: string | undefined,
  outcome: "YES" | "NO",
): number =>
  usePortfolioStore((s) => {
    if (!marketId) return 0;
    const key = `${marketId}::${outcome}`;
    return s.optimisticPositionDeltas[key]?.sharesDelta ?? 0;
  });

/* Object selector — returns the entry as a stable shallow ref */

export const useOptimisticDelta = (
  marketId: string | undefined,
  outcome: "YES" | "NO",
): OptimisticPositionDelta | null =>
  usePortfolioStore(
    useShallow((s) => {
      if (!marketId) return null;
      return s.optimisticPositionDeltas[`${marketId}::${outcome}`] ?? null;
    }),
  );

/* Action selector */

export const usePortfolioActions = () =>
  usePortfolioStore(
    useShallow((s) => ({
      applyOptimistic: s.applyOptimistic,
      clearOptimistic: s.clearOptimistic,
      clearAllOptimistic: s.clearAllOptimistic,
      markSynced: s.markSynced,
      bumpGeneration: s.bumpGeneration,
      setRefreshing: s.setRefreshing,
      reset: s.reset,
    })),
  );

/* External subscribe selectors */

export const selectOptimisticBalanceDelta = (s: PortfolioStore) =>
  s.optimisticBalanceDeltaUsd;
export const selectGeneration = (s: PortfolioStore) => s.serverGeneration;
