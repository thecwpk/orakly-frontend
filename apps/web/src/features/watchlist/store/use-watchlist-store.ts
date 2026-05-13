"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type WatchlistStore = {
  /** Source of truth: ordered list of starred market slugs (most recently added first). */
  slugs: string[];

  add: (slug: string) => void;
  remove: (slug: string) => void;
  toggle: (slug: string) => void;
  clear: () => void;
};

export const useWatchlistStore = create<WatchlistStore>()(
  persist(
    (set) => ({
      slugs: [],

      add: (slug) =>
        set((s) => {
          if (!slug) return s;
          if (s.slugs.includes(slug)) return s;
          return { slugs: [slug, ...s.slugs].slice(0, 200) };
        }),

      remove: (slug) =>
        set((s) => ({ slugs: s.slugs.filter((x) => x !== slug) })),

      toggle: (slug) =>
        set((s) => {
          if (!slug) return s;
          if (s.slugs.includes(slug)) {
            return { slugs: s.slugs.filter((x) => x !== slug) };
          }
          return { slugs: [slug, ...s.slugs].slice(0, 200) };
        }),

      clear: () => set({ slugs: [] }),
    }),
    {
      name: "orakly:watchlist",
      version: 1,
      partialize: (s) => ({ slugs: s.slugs }),
    },
  ),
);

export const selectWatchlistSet = (s: WatchlistStore): ReadonlySet<string> =>
  new Set(s.slugs);
export const selectWatchlistCount = (s: WatchlistStore): number =>
  s.slugs.length;

/** Stable selector returning whether `slug` is starred. */
export function makeIsStarredSelector(slug: string | undefined) {
  return (s: WatchlistStore): boolean =>
    Boolean(slug) && s.slugs.includes(slug as string);
}
