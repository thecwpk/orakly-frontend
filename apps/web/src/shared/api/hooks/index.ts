export { useDebouncedValue } from "./useDebouncedValue";

/* ---------------------------------------------------------------- */
/* Domain queries                                                     */
/* ---------------------------------------------------------------- */

export { useMarketsFeedQuery } from "./useMarketsFeedQuery";
export { useHubMarketsPreviewQuery } from "./useHubMarketsPreviewQuery";
export { useAttentionDashboardQuery } from "./useAttentionDashboardQuery";
export { useHomeStatsQuery } from "./useHomeStatsQuery";
export { useNarrativeWarsQuery } from "./useNarrativeWarsQuery";
export { useConvictionMarketsQuery } from "./useConvictionMarketsQuery";
export { useHubTrendingMarketsQuery } from "./useHubTrendingMarketsQuery";
export { useCategoryOverviewQuery } from "./useCategoryOverviewQuery";
export { useMarketSuggestionsQuery } from "./useMarketSuggestionsQuery";
export { useVoteSuggestionMutation } from "./useVoteSuggestionMutation";
export { useSpotPricesQuery } from "./useSpotPricesQuery";
export { useExplorerMarketsFeedQuery } from "./useExplorerMarketsFeedQuery";
export {
  useMarketsFeedScopedQuery,
  resolveMarketsScopedTake,
  type UseMarketsFeedScopedQueryParams,
} from "./useMarketsFeedScopedQuery";
export { useDiscoveryMarketsQuery } from "./use-discovery-markets-query";
export { useDiscoveryNewsQuery } from "./use-discovery-news-query";
export { usePortfolioQuery } from "./usePortfolioQuery";
export { useWalletBalanceQuery } from "./useWalletBalanceQuery";
export { useNotificationsQuery } from "./useNotificationsQuery";
export { useLedgerQuery } from "./useLedgerQuery";
export { useTradesInfiniteQuery } from "./useTradesInfiniteQuery";
export { useMarketBySlugQuery } from "./useMarketBySlugQuery";
export { useMarketOddsQuery } from "./useMarketOddsQuery";
export { useMarketProbabilityQuery } from "./useMarketProbabilityQuery";
export { useMarketTradesQuery } from "./useMarketTradesQuery";
export { useMarketVolumeWindowQuery } from "./useMarketVolumeWindowQuery";
export { useMarketQuoteDebouncedQuery } from "./useMarketQuoteDebouncedQuery";

/* ---------------------------------------------------------------- */
/* Mutations                                                          */
/* ---------------------------------------------------------------- */

export {
  useExecuteTradeMutation,
  type ExecuteTradeVariables,
  type TradeOptimisticPreview,
} from "./useExecuteTradeMutation";

/* ---------------------------------------------------------------- */
/* Realtime + sync (legacy single-purpose hooks)                      */
/* ---------------------------------------------------------------- */

export { usePortfolioRealtimeInvalidation } from "./usePortfolioRealtimeInvalidation";
export { useMarketOddsRealtimeInvalidation } from "./useMarketOddsRealtimeInvalidation";
export { useDebouncedTradingRefetchOnFocus } from "./useDebouncedTradingRefetchOnFocus";
export { useTradingQueriesSync } from "./useTradingQueriesSync";
export { useWalletOnChainSoftSync } from "./useWalletOnChainSoftSync";

/* ---------------------------------------------------------------- */
/* Generic primitives                                                 */
/* ---------------------------------------------------------------- */

export {
  useInfiniteScrollSentinel,
  type UseInfiniteScrollSentinelOptions,
} from "./use-infinite-scroll-sentinel";

export {
  useBackgroundRefresh,
  type UseBackgroundRefreshOptions,
} from "./use-background-refresh";

export {
  useStaleWhileRevalidate,
  type UseStaleWhileRevalidateOptions,
} from "./use-stale-while-revalidate";
