"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import {
  MARKETS_SORT_OPTIONS,
  useMarketsFilterStore,
  type MarketsSort,
} from "@/features/markets/store/use-markets-filter-store";
import type { MarketsExplorerFeedPreset } from "@/shared/constants/routes";

const VALID_SORTS = new Set<MarketsSort>(
  MARKETS_SORT_OPTIONS.map((s) => s.id),
);

const VALID_EXPLORER_FEEDS = new Set<MarketsExplorerFeedPreset>(["cross_hot"]);

function isDiscoveryFeedPath(pathname: string | null): boolean {
  return pathname === "/markets";
}

function parseUsdFloor(raw: string | null): number {
  if (raw == null || raw === "") return 0;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(Math.round(n), 10_000_000_000);
}

/**
 * Two-way URL ↔ filter-store sync on `/markets`.
 *
 * Params: `q`, `cat`, `sort`, `live`, `minLiq`, `minVol`, `feed`.
 *
 * Note: legacy `trending=0|1` is ignored for filtering — it was conflated with
 * the live-tape toggle and hid markets when the websocket was idle.
 */
export function useUrlFiltersSync() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const search = useMarketsFilterStore((s) => s.searchTerm);
  const setSearch = useMarketsFilterStore((s) => s.setSearchTerm);
  const category = useMarketsFilterStore((s) => s.category);
  const setCategory = useMarketsFilterStore((s) => s.setCategory);
  const sort = useMarketsFilterStore((s) => s.sort);
  const setSort = useMarketsFilterStore((s) => s.setSort);
  const trending = useMarketsFilterStore((s) => s.trendingOnly);
  const setTrending = useMarketsFilterStore((s) => s.setTrendingOnly);
  const minLiquidityUsd = useMarketsFilterStore((s) => s.minLiquidityUsd);
  const setMinLiquidityUsd = useMarketsFilterStore((s) => s.setMinLiquidityUsd);
  const minVolumeUsd = useMarketsFilterStore((s) => s.minVolumeUsd);
  const setMinVolumeUsd = useMarketsFilterStore((s) => s.setMinVolumeUsd);
  const explorerFeed = useMarketsFilterStore((s) => s.explorerFeed);
  const setExplorerFeed = useMarketsFilterStore((s) => s.setExplorerFeed);

  const hydratedRef = useRef(false);

  useEffect(() => {
    const q = params?.get("q") ?? "";
    const cat = params?.get("cat") ?? params?.get("category") ?? "all";
    const s = params?.get("sort");
    const live = params?.get("live");
    const ml = parseUsdFloor(params?.get("minLiq"));
    const mv = parseUsdFloor(params?.get("minVol"));
    const fd = params?.get("feed");

    if (q !== search) setSearch(q);
    if (cat !== category) setCategory(cat);
    if (s && VALID_SORTS.has(s as MarketsSort) && s !== sort) {
      setSort(s as MarketsSort);
    }
    const nextLive = live === "1" || live === "true";
    if (nextLive !== trending) setTrending(nextLive);
    if (isDiscoveryFeedPath(pathname)) {
      if (ml !== minLiquidityUsd) setMinLiquidityUsd(ml);
      if (mv !== minVolumeUsd) setMinVolumeUsd(mv);
      const nextFeed =
        fd && VALID_EXPLORER_FEEDS.has(fd as MarketsExplorerFeedPreset) ? (fd as MarketsExplorerFeedPreset) : null;
      if (nextFeed !== explorerFeed) setExplorerFeed(nextFeed);
    }

    hydratedRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, pathname]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    const discoveryFeed = isDiscoveryFeedPath(pathname);
    const next = new URLSearchParams();
    if (search.trim()) next.set("q", search.trim());
    if (category && category !== "all") next.set("cat", category);
    if (sort && sort !== "volume24h") next.set("sort", sort);
    if (trending) next.set("live", "1");
    if (discoveryFeed) {
      if (minLiquidityUsd > 0) next.set("minLiq", String(minLiquidityUsd));
      if (minVolumeUsd > 0) next.set("minVol", String(minVolumeUsd));
      if (explorerFeed) next.set("feed", explorerFeed);
    }

    const nextStr = next.toString();
    const currentStr = (params?.toString() ?? "").trim();
    if (nextStr === currentStr) return;

    const url = nextStr ? `${pathname}?${nextStr}` : pathname;
    router.replace(url, { scroll: false });
  }, [
    search,
    category,
    sort,
    trending,
    minLiquidityUsd,
    minVolumeUsd,
    explorerFeed,
    pathname,
    params,
    router,
  ]);
}
