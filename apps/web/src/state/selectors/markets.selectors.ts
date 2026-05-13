import { useShallow } from "../lib/shallow";
import {
  useMarketsMetaStore,
  type MarketsMetaStore,
} from "../stores/markets.store";

/**
 * `markets.selectors` re-exports the canonical filter and watchlist hooks
 * alongside the new meta selectors so consumers can `import { ... } from
 * "@/state"` without thinking about which slice owns what.
 */

export {
  useMarketsFilterStore,
  selectActiveFilterCount,
  MARKETS_SORT_OPTIONS,
  type MarketsSort,
  type MarketsViewMode,
} from "@/features/markets/store/use-markets-filter-store";

export {
  useWatchlistStore,
  selectWatchlistSet,
  selectWatchlistCount,
  makeIsStarredSelector,
} from "@/features/watchlist/store/use-watchlist-store";

/* Primitives */

export const useSelectedMarketId = (): string | null =>
  useMarketsMetaStore((s) => s.selectedMarketId);

export const useRecentlyViewedCount = (): number =>
  useMarketsMetaStore((s) => s.recentlyViewed.length);

export const useLastDetailScrollY = (): number =>
  useMarketsMetaStore((s) => s.lastDetailScrollY);

/* Stable array selectors via shallow */

export const useRecentlyViewed = (): readonly string[] =>
  useMarketsMetaStore(useShallow((s) => s.recentlyViewed));

/* Parametrized selector — returns `boolean` per slug, primitive output. */
export const useIsRecentlyViewed = (slug: string | undefined): boolean =>
  useMarketsMetaStore((s) =>
    slug ? s.recentlyViewed.includes(slug) : false,
  );

/* Action selector */

export const useMarketsMetaActions = () =>
  useMarketsMetaStore(
    useShallow((s) => ({
      pushRecent: s.pushRecent,
      removeRecent: s.removeRecent,
      clearRecents: s.clearRecents,
      setSelectedMarketId: s.setSelectedMarketId,
      setLastDetailScrollY: s.setLastDetailScrollY,
    })),
  );

/* External subscribe selectors */

export const selectRecentlyViewed = (s: MarketsMetaStore) => s.recentlyViewed;
export const selectSelectedMarketId = (s: MarketsMetaStore) => s.selectedMarketId;
