"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { useMarketsFilterStore } from "@/features/markets/store/use-markets-filter-store";

function isDiscoveryFeedPath(pathname: string | null): boolean {
  return pathname === "/markets";
}

/**
 * One-way filter-store → URL sync on `/markets`.
 *
 * Filters apply only from in-page controls (category rail, search, toggles).
 * Incoming query params (`cat`, `live`, legacy `trending`, etc.) are stripped on load.
 */
export function useUrlFiltersSync() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const search = useMarketsFilterStore((s) => s.searchTerm);
  const category = useMarketsFilterStore((s) => s.category);
  const sort = useMarketsFilterStore((s) => s.sort);
  const trending = useMarketsFilterStore((s) => s.trendingOnly);
  const minLiquidityUsd = useMarketsFilterStore((s) => s.minLiquidityUsd);
  const minVolumeUsd = useMarketsFilterStore((s) => s.minVolumeUsd);
  const explorerFeed = useMarketsFilterStore((s) => s.explorerFeed);

  const strippedRef = useRef(false);

  // Strip bookmarked / nav filter params — user must apply filters on the page.
  useEffect(() => {
    if (!isDiscoveryFeedPath(pathname)) return;
    if (strippedRef.current) return;
    const current = (params?.toString() ?? "").trim();
    if (!current) {
      strippedRef.current = true;
      return;
    }
    strippedRef.current = true;
    router.replace(pathname, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, params]);

  useEffect(() => {
    if (!isDiscoveryFeedPath(pathname)) return;
    if (!strippedRef.current) return;

    const next = new URLSearchParams();
    if (search.trim()) next.set("q", search.trim());
    if (category && category !== "all") next.set("cat", category);
    if (sort && sort !== "volume24h") next.set("sort", sort);
    if (trending) next.set("live", "1");
    if (minLiquidityUsd > 0) next.set("minLiq", String(minLiquidityUsd));
    if (minVolumeUsd > 0) next.set("minVol", String(minVolumeUsd));
    if (explorerFeed) next.set("feed", explorerFeed);

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
