"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import {
  readWatchlistIds,
  subscribeWatchlist,
  writeWatchlistIds,
} from "../lib/watchlist-storage";

export type UseWatchlistResult = {
  watchlist: string[];
  addToWatchlist: (id: string) => void;
  removeFromWatchlist: (id: string) => void;
  isWatchlisted: (id: string) => boolean;
  toggleWatchlist: (id: string) => void;
};

function getServerSnapshot(): string[] {
  return [];
}

/**
 * Local watchlist of market IDs (`localStorage` key `orakly_watchlist`).
 * No wallet required.
 */
export function useWatchlist(): UseWatchlistResult {
  const watchlist = useSyncExternalStore(
    subscribeWatchlist,
    readWatchlistIds,
    getServerSnapshot,
  );

  const addToWatchlist = useCallback((id: string) => {
    const trimmed = id.trim();
    if (!trimmed) return;
    const current = readWatchlistIds();
    if (current.includes(trimmed)) return;
    writeWatchlistIds([trimmed, ...current]);
  }, []);

  const removeFromWatchlist = useCallback((id: string) => {
    const trimmed = id.trim();
    if (!trimmed) return;
    writeWatchlistIds(readWatchlistIds().filter((item) => item !== trimmed));
  }, []);

  const isWatchlisted = useCallback(
    (id: string) => watchlist.includes(id.trim()),
    [watchlist],
  );

  const toggleWatchlist = useCallback((id: string) => {
    const trimmed = id.trim();
    if (!trimmed) return;
    const current = readWatchlistIds();
    if (current.includes(trimmed)) {
      writeWatchlistIds(current.filter((item) => item !== trimmed));
    } else {
      writeWatchlistIds([trimmed, ...current]);
    }
  }, []);

  return {
    watchlist,
    addToWatchlist,
    removeFromWatchlist,
    isWatchlisted,
    toggleWatchlist,
  };
}

/** One-shot hydrate helper for non-React code. */
export function useWatchlistCount(): number {
  const { watchlist } = useWatchlist();
  return watchlist.length;
}

/** Ensure SSR/client first paint reads storage after mount when needed. */
export function useWatchlistHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);
  return hydrated;
}
