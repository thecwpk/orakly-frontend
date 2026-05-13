"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import {
  MARKETS_SORT_OPTIONS,
  useMarketsFilterStore,
  type MarketsSort,
} from "@/features/markets/store/use-markets-filter-store";

const VALID_SORTS = new Set<MarketsSort>(
  MARKETS_SORT_OPTIONS.map((s) => s.id),
);

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
 * Params: `q`, `cat`, `sort`, `trending`, `minLiq`, `minVol`.
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

  const hydratedRef = useRef(false);

  useEffect(() => {
    const q = params?.get("q") ?? "";
    const cat = params?.get("cat") ?? "all";
    const s = params?.get("sort");
    const t = params?.get("trending");
    const ml = parseUsdFloor(params?.get("minLiq"));
    const mv = parseUsdFloor(params?.get("minVol"));

    if (q !== search) setSearch(q);
    if (cat !== category) setCategory(cat);
    if (s && VALID_SORTS.has(s as MarketsSort) && s !== sort) {
      setSort(s as MarketsSort);
    }
    if (t !== null) {
      const next = t === "1" || t === "true";
      if (next !== trending) setTrending(next);
    }
    if (isDiscoveryFeedPath(pathname)) {
      if (ml !== minLiquidityUsd) setMinLiquidityUsd(ml);
      if (mv !== minVolumeUsd) setMinVolumeUsd(mv);
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
    if (discoveryFeed) {
      next.set("trending", trending ? "1" : "0");
    } else if (trending) {
      next.set("trending", "1");
    }
    if (discoveryFeed) {
      if (minLiquidityUsd > 0) next.set("minLiq", String(minLiquidityUsd));
      if (minVolumeUsd > 0) next.set("minVol", String(minVolumeUsd));
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
    pathname,
    params,
    router,
  ]);
}
