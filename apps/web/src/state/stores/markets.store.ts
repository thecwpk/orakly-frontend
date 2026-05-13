"use client";

import { create } from "zustand";
import { devtools, persist, subscribeWithSelector } from "zustand/middleware";
import { devtoolsConfig } from "../lib/devtools";
import { createSafeJSONStorage, persistKey } from "../lib/ssr-storage";

/**
 * Domain-level *meta* state for markets:
 *
 *  - `recentlyViewed` — a small ring buffer of slugs visited (persisted),
 *  - `selectedMarketId` — currently focused market id (transient),
 *  - `lastDetailScrollY` — restore scroll on back-nav (transient).
 *
 * Filter UI lives in `useMarketsFilterStore` (legacy, persisted independently)
 * and watchlist in `useWatchlistStore`. Both are intentionally kept separate
 * because each has its own persistence schema and migration story.
 *
 * This slice does **not** subscribe to or duplicate market data — that comes
 * from React Query (server state). Stick to UI/coordination state here.
 */

const MAX_RECENTS = 20;

export type MarketsMetaState = {
  /** Slugs of recently viewed markets, most-recent-first. */
  recentlyViewed: string[];
  /** Currently focused market id (route param or selection). */
  selectedMarketId: string | null;
  /** Detail-page scroll restoration cache (transient). */
  lastDetailScrollY: number;
};

export type MarketsMetaActions = {
  pushRecent: (slug: string) => void;
  removeRecent: (slug: string) => void;
  clearRecents: () => void;
  setSelectedMarketId: (id: string | null) => void;
  setLastDetailScrollY: (y: number) => void;
};

export type MarketsMetaStore = MarketsMetaState & MarketsMetaActions;

const INITIAL_STATE: MarketsMetaState = {
  recentlyViewed: [],
  selectedMarketId: null,
  lastDetailScrollY: 0,
};

export const useMarketsMetaStore = create<MarketsMetaStore>()(
  devtools(
    persist(
      subscribeWithSelector((set) => ({
        ...INITIAL_STATE,

        pushRecent: (slug) =>
          set(
            (s) => {
              if (!slug) return s;
              const next = [slug, ...s.recentlyViewed.filter((x) => x !== slug)];
              if (next.length > MAX_RECENTS) next.length = MAX_RECENTS;
              return { recentlyViewed: next };
            },
            false,
            "markets/pushRecent",
          ),

        removeRecent: (slug) =>
          set(
            (s) => ({
              recentlyViewed: s.recentlyViewed.filter((x) => x !== slug),
            }),
            false,
            "markets/removeRecent",
          ),

        clearRecents: () =>
          set({ recentlyViewed: [] }, false, "markets/clearRecents"),

        setSelectedMarketId: (selectedMarketId) =>
          set({ selectedMarketId }, false, "markets/setSelectedMarketId"),

        setLastDetailScrollY: (lastDetailScrollY) =>
          set({ lastDetailScrollY }, false, "markets/setLastDetailScrollY"),
      })),
      {
        name: persistKey("markets-meta"),
        version: 1,
        storage: createSafeJSONStorage(),
        partialize: (s) => ({ recentlyViewed: s.recentlyViewed }),
      },
    ),
    devtoolsConfig("markets"),
  ),
);

export function getMarketsMetaSnapshot(): Readonly<MarketsMetaState> {
  return useMarketsMetaStore.getState();
}
