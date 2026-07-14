"use client";

import { create } from "zustand";
import {
  readWatchlistIds,
  subscribeWatchlist,
  writeWatchlistIds,
} from "../lib/watchlist-storage";

type WatchlistStore = {
  /** Ordered list of starred market IDs (most recently added first). */
  ids: string[];
  /** @deprecated Use `ids` — kept as alias while migrating slug callers. */
  slugs: string[];

  add: (id: string) => void;
  remove: (id: string) => void;
  toggle: (id: string) => void;
  clear: () => void;
  hydrate: () => void;
};

function syncFromStorage(): string[] {
  return readWatchlistIds();
}

export const useWatchlistStore = create<WatchlistStore>((set, get) => ({
  ids: [],
  slugs: [],

  hydrate: () => {
    const ids = syncFromStorage();
    set({ ids, slugs: ids });
  },

  add: (id) => {
    const trimmed = id?.trim();
    if (!trimmed) return;
    if (get().ids.includes(trimmed)) return;
    const ids = [trimmed, ...get().ids].slice(0, 200);
    writeWatchlistIds(ids);
    set({ ids, slugs: ids });
  },

  remove: (id) => {
    const trimmed = id?.trim();
    if (!trimmed) return;
    const ids = get().ids.filter((x) => x !== trimmed);
    writeWatchlistIds(ids);
    set({ ids, slugs: ids });
  },

  toggle: (id) => {
    const trimmed = id?.trim();
    if (!trimmed) return;
    if (get().ids.includes(trimmed)) {
      get().remove(trimmed);
    } else {
      get().add(trimmed);
    }
  },

  clear: () => {
    writeWatchlistIds([]);
    set({ ids: [], slugs: [] });
  },
}));

if (typeof window !== "undefined") {
  useWatchlistStore.getState().hydrate();
  subscribeWatchlist(() => {
    const ids = readWatchlistIds();
    useWatchlistStore.setState({ ids, slugs: ids });
  });
}

export const selectWatchlistSet = (s: WatchlistStore): ReadonlySet<string> =>
  new Set(s.ids);

export const selectWatchlistCount = (s: WatchlistStore): number => s.ids.length;

/** Stable selector returning whether `id` is starred. */
export function makeIsStarredSelector(id: string | undefined) {
  return (s: WatchlistStore): boolean => Boolean(id) && s.ids.includes(id as string);
}
