/* ---------------------------------------------------------------- */
/* Query infrastructure                                              */
/* ---------------------------------------------------------------- */

export {
  queryRoot,
  queryKeys,
  marketSubtreeFilter,
  userSubtreeFilter,
  adminSubtreeFilter,
  rootSubtreeFilter,
} from "./query-keys";

export {
  CACHE_POLICY,
  TIERS,
  withTier,
  type CacheTier,
  type CacheTierName,
  type CachePolicyKey,
} from "./cache-policy";

export {
  GC,
  STALE,
  REALTIME_TIER,
  FAST_TIER,
  WARM_TIER,
  COOL_TIER,
  COLD_TIER,
  REFERENCE_TIER,
  PORTFOLIO_POLL_MS,
} from "./cache-tiers";

export { createAppQueryClient, subscribeAppLifecycleHints } from "./query-client";
export { unwrapApiResult, QueryApiError } from "./unwrap";
export { debounceAsyncFn } from "./debounce";

/* ---------------------------------------------------------------- */
/* Invalidation                                                      */
/* ---------------------------------------------------------------- */

export {
  invalidateUserTrading,
  invalidateUserSubtree,
  invalidateMarketLive,
  invalidateMarketsFeed,
  invalidateProfile,
  invalidateLeaderboard,
  invalidateActivityFeed,
  invalidateAdminSubtree,
  invalidateOnSignOut,
  clearAllAppQueries,
} from "./invalidate";

/* ---------------------------------------------------------------- */
/* Optimistic mutations                                               */
/* ---------------------------------------------------------------- */

export {
  createOptimisticMutation,
  applyOptimisticPatch,
  type OptimisticPatch,
  type OptimisticContext,
  type CreateOptimisticMutationOptions,
} from "./optimistic";

/* ---------------------------------------------------------------- */
/* Realtime sync                                                     */
/* ---------------------------------------------------------------- */

export {
  useRealtimeSync,
  useMarketRealtimeSync,
  useFeedRealtimeSync,
  type UseRealtimeSyncOptions,
} from "./realtime";

/* ---------------------------------------------------------------- */
/* Prefetch + persistence                                             */
/* ---------------------------------------------------------------- */

export {
  prefetchMarketsFeed,
  prefetchMarketOdds,
  prefetchPortfolio,
  usePrefetchMarketOdds,
  usePrefetchMarketsFeed,
  usePrefetchPortfolio,
} from "./prefetch";

export {
  hydratePersistedQuery,
  subscribePersistedQueries,
  bootstrapQueryPersistence,
  DEFAULT_PERSIST_RULES,
  type PersistRule,
  type HydrateOptions,
} from "./persistence";

/* ---------------------------------------------------------------- */
/* Hooks                                                             */
/* ---------------------------------------------------------------- */

export * from "./hooks";
