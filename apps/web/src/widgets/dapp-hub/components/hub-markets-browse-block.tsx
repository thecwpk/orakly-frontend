"use client";

import { formatCompactUsd } from "@orakly/utils";
import { Bookmark, ChevronRight, LayoutGrid, List, Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { Market } from "@orakly/types";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/shared/constants/routes";
import { PrefetchLink } from "@/shared/ui";
import { TrendingMarketCard } from "@/widgets/trending-prediction-markets";
import { TrendingMarketCardSkeleton } from "@/widgets/trending-prediction-markets/components/trending-market-card-skeleton";
import { mergeHubBrowsePreview } from "../lib/merge-hub-spotlight-markets";

const PREVIEW_LIMIT = 12;

export type HubBrowseTabId = "all" | "trending" | "volume" | "activity" | "hot" | "new_lane";

const TAB_META: readonly { id: HubBrowseTabId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "trending", label: "Trending" },
  { id: "volume", label: "Volume" },
  { id: "activity", label: "Activity" },
  { id: "hot", label: "Hot" },
  { id: "new_lane", label: "New" },
] as const;

function excludeSlugFilter(slug: string | undefined, markets: readonly Market[]): readonly Market[] {
  if (!slug) return markets;
  return markets.filter((m) => m.slug !== slug);
}

/** Hub “More” opens marketing discovery (full directory). */
function discoverHref(): string {
  return ROUTES.discover;
}

function laneVolumeSkew(markets: readonly Market[]): { skewPct: number; volUsd: number; openCount: number } {
  let vwYes = 0;
  let vwNo = 0;
  let t = 0;
  let openCount = 0;
  for (const m of markets) {
    const v = m.volumeUsd ?? 0;
    if (m.status === "OPEN") openCount += 1;
    if (!Number.isFinite(v) || v <= 0) continue;
    t += v;
    const p = m.probability ?? 0.5;
    vwYes += v * p;
    vwNo += v * (1 - p);
  }
  if (!t) return { skewPct: 50, volUsd: 0, openCount };
  const yShare = vwYes / (vwYes + vwNo || 1);
  let volUsd = 0;
  for (const m of markets) {
    const v = m.volumeUsd ?? 0;
    if (Number.isFinite(v) && v > 0) volUsd += v;
  }
  return { skewPct: Math.round(yShare * 100), volUsd, openCount };
}

export function HubMarketsBrowseBlock({
  excludeSlug,
  liveSet,
  trendingList,
  trendingTape,
  trendingActivity,
  trendingHot,
  trendingNewTrending,
  loadingTrendingList,
  loadingTrendingTape,
  loadingTrendingActivity,
  loadingTrendingHot,
  loadingTrendingNew,
  onPrefetchDirectory,
}: {
  excludeSlug?: string;
  liveSet: ReadonlySet<string>;
  trendingList: readonly Market[];
  trendingTape: readonly Market[];
  trendingActivity: readonly Market[];
  trendingHot: readonly Market[];
  trendingNewTrending: readonly Market[];
  loadingTrendingList: boolean;
  loadingTrendingTape: boolean;
  loadingTrendingActivity: boolean;
  loadingTrendingHot: boolean;
  loadingTrendingNew: boolean;
  onPrefetchDirectory: () => void;
}) {
  const [tab, setTab] = useState<HubBrowseTabId>("all");
  const [view, setView] = useState<"grid" | "list">("grid");

  const laneList = useMemo(() => excludeSlugFilter(excludeSlug, trendingList), [excludeSlug, trendingList]);
  const laneTape = useMemo(() => excludeSlugFilter(excludeSlug, trendingTape), [excludeSlug, trendingTape]);
  const laneActivity = useMemo(() => excludeSlugFilter(excludeSlug, trendingActivity), [excludeSlug, trendingActivity]);
  const laneHot = useMemo(() => excludeSlugFilter(excludeSlug, trendingHot), [excludeSlug, trendingHot]);
  const laneNew = useMemo(() => excludeSlugFilter(excludeSlug, trendingNewTrending), [excludeSlug, trendingNewTrending]);

  const mergedAll = useMemo(
    () => mergeHubBrowsePreview(laneList, laneTape, laneActivity, laneHot, laneNew, PREVIEW_LIMIT),
    [laneList, laneTape, laneActivity, laneHot, laneNew],
  );

  const displayed = useMemo(() => {
    switch (tab) {
      case "all":
        return mergedAll;
      case "trending":
        return laneList.slice(0, PREVIEW_LIMIT);
      case "volume":
        return laneTape.slice(0, PREVIEW_LIMIT);
      case "activity":
        return laneActivity.slice(0, PREVIEW_LIMIT);
      case "hot":
        return laneHot.slice(0, PREVIEW_LIMIT);
      case "new_lane":
        return laneNew.slice(0, PREVIEW_LIMIT);
      default:
        return mergedAll;
    }
  }, [tab, mergedAll, laneList, laneTape, laneActivity, laneHot, laneNew]);

  const loading =
    displayed.length === 0 &&
    (tab === "all"
      ? loadingTrendingList ||
        loadingTrendingTape ||
        loadingTrendingActivity ||
        loadingTrendingHot ||
        loadingTrendingNew
      : tab === "trending"
        ? loadingTrendingList
        : tab === "volume"
          ? loadingTrendingTape
          : tab === "activity"
            ? loadingTrendingActivity
            : tab === "hot"
              ? loadingTrendingHot
              : loadingTrendingNew);

  const volumeMax = useMemo(() => {
    let mx = 0;
    for (const m of displayed) {
      const v = m.volumeUsd ?? 0;
      if (Number.isFinite(v) && v > mx) mx = v;
    }
    return mx > 0 ? mx : 1;
  }, [displayed]);

  const moreHref = discoverHref();
  const tabLabel = TAB_META.find((t) => t.id === tab)?.label ?? "All";

  const stripStats = useMemo(() => laneVolumeSkew(displayed), [displayed]);

  const liveInPreview = useMemo(
    () => displayed.reduce((n, m) => n + (liveSet.has(m.id) ? 1 : 0), 0),
    [displayed, liveSet],
  );

  const iconGhost =
    "flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-muted/50 hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

  const gridClass = view === "list" ? "grid grid-cols-1 gap-2 sm:gap-2.5" : "mb-grid";

  return (
    <section
      id="live-markets"
      className={cn("relative w-full overflow-hidden rounded-2xl bg-background/55 mb-markets-surface")}
      aria-labelledby="hub-browse-heading"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_85%_55%_at_50%_-28%,hsl(220_45%_42%/0.12),transparent_58%)]"
      />

      <div className="relative">
        {/* Header — title + compact stats (no separate “ticker bar”) */}
        <div className="border-b border-border px-5 py-4 sm:px-6 sm:py-5 min-[640px]:px-6 min-[640px]:py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 space-y-1.5">
              <h2
                id="hub-browse-heading"
                className="mb-section-title text-[16px] font-semibold tracking-tight text-foreground sm:text-[17px]"
              >
                All markets
              </h2>
              <p className="max-w-2xl text-pretty font-mono text-[11px] leading-relaxed text-muted-foreground sm:text-[11.5px]">
                <span className="font-semibold text-primary/95">{tabLabel}</span>
                <span className="text-muted-foreground/80"> · </span>
                <span className="tabular-nums text-foreground/90">{displayed.length} markets</span>
                <span className="text-muted-foreground/80"> · </span>
                <span className="tabular-nums text-foreground/90">{stripStats.openCount} open</span>
                <span className="text-muted-foreground/80"> · </span>
                <span className="tabular-nums text-foreground/90">skew {stripStats.skewPct}% yes</span>
                <span className="text-muted-foreground/80"> · </span>
                <span className="tabular-nums text-foreground/90">vol {formatCompactUsd(stripStats.volUsd)}</span>
                <span className="text-muted-foreground/80"> · </span>
                <span className="tabular-nums text-yes/90">{liveInPreview} live</span>
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-0.5 pt-0.5" role="toolbar" aria-label="Market shortcuts">
            <PrefetchLink
              href={ROUTES.discover}
              onMouseEnter={onPrefetchDirectory}
              className={iconGhost}
              aria-label="Open directory (search & filters)"
            >
              <Search className="h-[17px] w-[17px]" strokeWidth={1.65} aria-hidden />
            </PrefetchLink>
            <button
              type="button"
              className={cn(iconGhost, view === "grid" && "bg-muted/60 text-foreground")}
              aria-pressed={view === "grid"}
              aria-label="Grid view"
              onClick={() => setView("grid")}
            >
              <LayoutGrid className="h-[17px] w-[17px]" strokeWidth={1.65} aria-hidden />
            </button>
            <button
              type="button"
              className={cn(iconGhost, view === "list" && "bg-muted/60 text-foreground")}
              aria-pressed={view === "list"}
              aria-label="List view"
              onClick={() => setView("list")}
            >
              <List className="h-[17px] w-[17px]" strokeWidth={1.65} aria-hidden />
            </button>
            <PrefetchLink href={ROUTES.watchlist} className={iconGhost} aria-label="Watchlist">
              <Bookmark className="h-[17px] w-[17px]" strokeWidth={1.65} aria-hidden />
            </PrefetchLink>
            </div>
          </div>
        </div>

        {/* Category lanes — pill slider (snap), theme tokens */}
        <div className="mb-tabs-rail-wrap flex min-w-0 items-stretch gap-0 border-b border-border">
          <div className="relative min-w-0 flex-1 px-2 py-2.5 sm:px-3">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-y-2 left-0 z-[1] w-7 bg-gradient-to-r from-background to-transparent sm:w-9"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-y-2 right-0 z-[1] w-7 bg-gradient-to-l from-background to-transparent sm:w-9"
            />
            <div
              className="mb-tabs-rail flex snap-x snap-mandatory gap-2 overflow-x-auto px-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              role="tablist"
              aria-label="Market lanes"
            >
              {TAB_META.map(({ id, label }) => {
                const active = tab === id;
                return (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setTab(id)}
                    className={cn(
                      "relative shrink-0 snap-start rounded-full border px-3.5 py-2 text-[12.5px] font-medium tracking-tight transition-[border-color,background-color,color,box-shadow] sm:px-4 sm:py-2.5 sm:text-[13px]",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                      active
                        ? "border-primary/35 bg-primary/10 text-foreground shadow-[0_0_20px_-10px_color-mix(in_srgb,var(--primary)_22%,transparent)]"
                        : "border-border bg-card/70 text-muted-foreground hover:border-border hover:bg-muted/45 hover:text-foreground",
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
          <PrefetchLink
            href={moreHref}
            onMouseEnter={onPrefetchDirectory}
            className="flex shrink-0 items-center gap-1 border-l border-border px-3 py-2.5 text-[12px] font-medium text-primary/90 transition-colors hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/25 sm:px-3.5"
            aria-label="Open full directory for this lane"
          >
            <span className="hidden sm:inline">More</span>
            <ChevronRight className="h-4 w-4 shrink-0 opacity-80" strokeWidth={2} aria-hidden />
          </PrefetchLink>
        </div>

        <div className="px-5 py-5 sm:px-6 sm:py-6 min-[640px]:px-6 min-[640px]:py-6">
          {loading ? (
            <div className={view === "list" ? "grid grid-cols-1 gap-2 sm:gap-2.5" : "mb-grid"}>
              {Array.from({ length: PREVIEW_LIMIT }).map((_, i) => (
                <TrendingMarketCardSkeleton key={i} index={i} compact />
              ))}
            </div>
          ) : displayed.length === 0 ? (
            <p className="rounded-md border border-border bg-muted/10 py-10 text-center text-[12px] leading-relaxed text-muted-foreground">
              No markets in this lane yet.
            </p>
          ) : (
            <div className={gridClass}>
              {displayed.map((m, i) => (
                <TrendingMarketCard
                  key={m.id}
                  market={m}
                  index={i}
                  accent="emerald"
                  chrome="subtle"
                  volumeMax={volumeMax}
                  isLive={liveSet.has(m.id)}
                  variant="compact"
                  directoryStyle
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
