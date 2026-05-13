"use client";

import {
  useMutation,
  useQueryClient,
  type QueryClient,
  type QueryKey,
  type UseMutationOptions,
  type UseMutationResult,
} from "@tanstack/react-query";

/* ---------------------------------------------------------------- */
/* Types                                                             */
/* ---------------------------------------------------------------- */

/**
 * A *patch* describes an optimistic mutation against a single cache key.
 *
 *  - `key`     → the React Query key this patch targets
 *  - `update`  → a pure updater applied immediately on `onMutate`
 *
 * The factory takes care of:
 *   1. Cancelling in-flight refetches against `key`.
 *   2. Snapshotting current cache for rollback on error.
 *   3. Applying `update` synchronously to the cache.
 *   4. Restoring snapshots if the mutation rejects.
 *   5. Optionally re-validating from the server on settle.
 */
export type OptimisticPatch<TVariables, TQueryData = unknown> = {
  key: QueryKey;
  /** Receives previous cache data + variables, returns next data (or `undefined` to skip). */
  update: (
    previous: TQueryData | undefined,
    variables: TVariables,
  ) => TQueryData | undefined;
};

export type OptimisticContext = {
  /** Map of `JSON.stringify(key)` → previous data for rollback. */
  snapshots: Map<string, unknown>;
};

export type CreateOptimisticMutationOptions<TData, TVariables, TError = Error> = {
  /** The server call that performs the real write. */
  mutationFn: (variables: TVariables) => Promise<TData>;

  /**
   * Returns the list of optimistic patches to apply for this set of variables.
   * Called inside `onMutate`, *before* the network call.
   */
  optimistic?: (variables: TVariables) => OptimisticPatch<TVariables>[];

  /**
   * Keys to *invalidate* on settle (success and error). Use this to reconcile
   * the optimistic cache back to the server's truth without manual setQueryData.
   *
   * Tip: prefer subtree filters (e.g. `marketSubtreeFilter(id)`) when many
   * dynamic params live under the same prefix.
   */
  invalidateOnSettle?: (
    variables: TVariables,
    data: TData | undefined,
    error: TError | null,
  ) => Array<QueryKey | { predicate: (q: { queryKey: QueryKey }) => boolean }>;

  /** Hook for side effects after a successful settle (e.g. toasts, navigation). */
  onSuccess?: (data: TData, variables: TVariables, qc: QueryClient) => void;

  /** Hook for side effects after a failed settle (e.g. error toasts). */
  onError?: (error: TError, variables: TVariables, qc: QueryClient) => void;
};

/* ---------------------------------------------------------------- */
/* Factory                                                           */
/* ---------------------------------------------------------------- */

const stableStr = (k: QueryKey) => JSON.stringify(k);

/**
 * Build a `useMutation` that wires optimistic UI in a few lines.
 *
 * Example:
 * ```tsx
 * const useFollow = createOptimisticMutation<void, { address: string }, Error>({
 *   mutationFn: ({ address }) => fetch(`/api/follow/${address}`, { method: "POST" }).then(() => {}),
 *   optimistic: ({ address }) => [
 *     {
 *       key: queryKeys.profile.byAddress(address),
 *       update: (prev?: TraderProfile) =>
 *         prev ? { ...prev, isFollowing: true, followers: prev.followers + 1 } : prev,
 *     },
 *   ],
 *   invalidateOnSettle: ({ address }) => [queryKeys.profile.byAddress(address)],
 * });
 * ```
 */
export function createOptimisticMutation<TData, TVariables, TError = Error>(
  options: CreateOptimisticMutationOptions<TData, TVariables, TError>,
) {
  return function useOptimistic(
    extra?: Omit<
      UseMutationOptions<TData, TError, TVariables, OptimisticContext>,
      "mutationFn" | "onMutate" | "onError" | "onSettled" | "onSuccess"
    >,
  ): UseMutationResult<TData, TError, TVariables, OptimisticContext> {
    const qc = useQueryClient();

    return useMutation<TData, TError, TVariables, OptimisticContext>({
      ...extra,
      mutationFn: options.mutationFn,

      onMutate: async (variables) => {
        const patches = options.optimistic?.(variables) ?? [];
        const snapshots = new Map<string, unknown>();

        for (const patch of patches) {
          await qc.cancelQueries({ queryKey: patch.key });
          const prev = qc.getQueryData<unknown>(patch.key);
          snapshots.set(stableStr(patch.key), prev);

          const next = patch.update(prev, variables);
          if (next !== undefined) {
            qc.setQueryData(patch.key, next);
          }
        }

        return { snapshots };
      },

      onError: (error, variables, ctx) => {
        if (ctx?.snapshots) {
          for (const [keyStr, snapshot] of ctx.snapshots) {
            const key = JSON.parse(keyStr) as QueryKey;
            qc.setQueryData(key, snapshot);
          }
        }
        options.onError?.(error, variables, qc);
      },

      onSuccess: (data, variables) => {
        options.onSuccess?.(data, variables, qc);
      },

      onSettled: async (data, error, variables) => {
        const targets =
          options.invalidateOnSettle?.(variables, data ?? undefined, error ?? null) ?? [];
        for (const t of targets) {
          if (typeof t === "object" && t !== null && "predicate" in t) {
            await qc.invalidateQueries(t);
          } else {
            await qc.invalidateQueries({ queryKey: t });
          }
        }
      },
    });
  };
}

/* ---------------------------------------------------------------- */
/* Imperative variant — for use outside hooks                         */
/* ---------------------------------------------------------------- */

/**
 * Apply an optimistic patch + rollback against an arbitrary `QueryClient`.
 * Returns a `commit()` and `rollback()` pair so callers can drive the
 * lifecycle manually (e.g. inside a multi-step wizard).
 */
export async function applyOptimisticPatch<TQueryData = unknown>(
  qc: QueryClient,
  key: QueryKey,
  update: (prev: TQueryData | undefined) => TQueryData | undefined,
): Promise<{ rollback: () => void; previous: TQueryData | undefined }> {
  await qc.cancelQueries({ queryKey: key });
  const previous = qc.getQueryData<TQueryData>(key);
  const next = update(previous);
  if (next !== undefined) {
    qc.setQueryData(key, next);
  }
  return {
    previous,
    rollback: () => {
      qc.setQueryData(key, previous);
    },
  };
}
