"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { MarketsExplorerFeedPreset } from "@/shared/constants/routes";

export type MarketsSort =
  | "volume24h"
  | "liquidity"
  | "newest"
  | "closingSoon"
  | "tightest";

export type MarketsViewMode = "grid" | "list";

export const MARKETS_SORT_OPTIONS: ReadonlyArray<{
  id: MarketsSort;
  label: string;
  hint: string;
}> = [
  { id: "volume24h", label: "Volume (24h)", hint: "Highest notional first" },
  { id: "liquidity", label: "Liquidity", hint: "Deepest books first" },
  { id: "tightest", label: "Tightest odds", hint: "Closest to 50/50" },
  { id: "closingSoon", label: "Closing soon", hint: "By resolution date" },
  { id: "newest", label: "Newest", hint: "Most recently listed" },
] as const;

type MarketsFilterStore = {
  /** Free-text search across title + category. Mirrored from `?q=`. */
  searchTerm: string;
  setSearchTerm: (value: string) => void;

  /** Slug from `MARKET_CATEGORIES` or "all". */
  category: string;
  setCategory: (slug: string) => void;

  /** Active sort criterion. */
  sort: MarketsSort;
  setSort: (sort: MarketsSort) => void;

  /** Surface only markets with realtime activity in the last few minutes. */
  trendingOnly: boolean;
  setTrendingOnly: (next: boolean) => void;
  toggleTrendingOnly: () => void;

  /** Minimum liquidity (USD). `0` = off. Mirrored from `?minLiq=`. */
  minLiquidityUsd: number;
  setMinLiquidityUsd: (n: number) => void;

  /** Minimum volume / notional (USD). `0` = off. Mirrored from `?minVol=`. */
  minVolumeUsd: number;
  setMinVolumeUsd: (n: number) => void;

  /** Grid (rich cards) or list (dense rows). */
  viewMode: MarketsViewMode;
  setViewMode: (mode: MarketsViewMode) => void;

  /**
   * Optional server-feed lens for `/markets` (`?feed=cross_hot`).
   * `null` = full directory via explorer feed.
   */
  explorerFeed: MarketsExplorerFeedPreset | null;
  setExplorerFeed: (feed: MarketsExplorerFeedPreset | null) => void;

  /** Reset all filters to defaults (search included). */
  reset: () => void;
};

const DEFAULTS = {
  searchTerm: "",
  category: "all",
  sort: "volume24h" as MarketsSort,
  trendingOnly: false,
  minLiquidityUsd: 0,
  minVolumeUsd: 0,
  viewMode: "grid" as MarketsViewMode,
  explorerFeed: null as MarketsExplorerFeedPreset | null,
};

export const useMarketsFilterStore = create<MarketsFilterStore>()(
  persist(
    (set) => ({
      ...DEFAULTS,

      setSearchTerm: (searchTerm) => set({ searchTerm }),
      setCategory: (category) => set({ category }),
      setSort: (sort) => set({ sort }),
      setTrendingOnly: (trendingOnly) => set({ trendingOnly }),
      toggleTrendingOnly: () =>
        set((s) => ({ trendingOnly: !s.trendingOnly })),
      setMinLiquidityUsd: (minLiquidityUsd) => set({ minLiquidityUsd }),
      setMinVolumeUsd: (minVolumeUsd) => set({ minVolumeUsd }),
      setViewMode: (viewMode) => set({ viewMode }),
      setExplorerFeed: (explorerFeed) => set({ explorerFeed }),

      reset: () => set({ ...DEFAULTS }),
    }),
    {
      name: "orakly:markets-filter",
      version: 6,
      // Only persist view + sort — category/search/floors apply per visit via UI.
      partialize: (s) => ({
        sort: s.sort,
        viewMode: s.viewMode,
      }),
      migrate: (persisted, version) => {
        if (persisted && typeof persisted === "object") {
          const rest = { ...(persisted as Record<string, unknown>) };
          delete rest.trendingOnly;
          if (version < 6) {
            delete rest.category;
          }
          return rest;
        }
        return persisted;
      },
    },
  ),
);

export const selectActiveFilterCount = (s: MarketsFilterStore): number => {
  let n = 0;
  if (s.searchTerm.trim().length > 0) n++;
  if (s.category !== "all") n++;
  if (s.trendingOnly) n++;
  if (s.sort !== "volume24h") n++;
  if (s.minLiquidityUsd > 0) n++;
  if (s.minVolumeUsd > 0) n++;
  if (s.explorerFeed) n++;
  return n;
};
