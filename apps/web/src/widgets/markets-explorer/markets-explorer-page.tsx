"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Activity, Loader2, Plus, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { MARKET_CATEGORIES } from "@/features/markets/lib/categories";
import { useMarketsFilterStore } from "@/features/markets/store/use-markets-filter-store";
import { useExplorerMarketsFeedQuery } from "@/shared/api/hooks/useExplorerMarketsFeedQuery";
import { useMarketsFeedScopedQuery } from "@/shared/api/hooks";
import { invalidateMarketsFeed } from "@/shared/api/invalidate";
import { appStickyToolbarBleedStyle } from "@/shared/constants/page-layout";
import { ROUTES } from "@/shared/constants/routes";
import { useInfiniteScroll, usePagedSlice } from "@/shared/hooks/use-infinite-scroll";
import { Container, Section, Stack } from "@/shared/ui";
import { useLiveMarketStatus } from "@/widgets/trending-prediction-markets/lib/use-live-market-status";
import { cn } from "@/lib/utils";
import { MarketsCategoryRail } from "./components/markets-category-rail";
import { MarketsExplorerDiscoveryStrip } from "./components/markets-explorer-discovery-strip";
import { MarketsExplorerGrid, MarketsExplorerGridSkeleton } from "./components/markets-explorer-grid";
import { MarketsExplorerSidebar } from "./components/markets-explorer-sidebar";
import { MarketsHotNarrativesRail } from "./components/markets-hot-narratives-rail";
import { MarketsListRow } from "./components/markets-list-row";
import { MarketsListSkeleton } from "./components/markets-list-skeleton";
import { MarketsToolbar } from "./components/markets-toolbar";
import { filterMarkets, sortMarkets } from "./lib/filter-and-sort";
import { useUrlFiltersSync } from "./lib/use-url-filters-sync";

const PAGE_SIZE = 30;

export function MarketsExplorerPage() {
  useUrlFiltersSync();
  const reduceMotion = useReducedMotion();

  const qc = useQueryClient();
  const explorerFeed = useMarketsFilterStore((s) => s.explorerFeed);
  const directoryQ = useExplorerMarketsFeedQuery(explorerFeed !== "cross_hot");
  const crossHotQ = useMarketsFeedScopedQuery({
    scope: "full",
    lane: "list",
    filter: "cross_hot",
    take: 120,
    enabled: explorerFeed === "cross_hot",
  });

  const activeFeed = explorerFeed === "cross_hot" ? crossHotQ : directoryQ;
  const { data, isPending, isFetching, isError, refetch, dataUpdatedAt } = activeFeed;
  const feedLoading = isPending && !data;

  const search = useMarketsFilterStore((s) => s.searchTerm);
  const category = useMarketsFilterStore((s) => s.category);
  const sort = useMarketsFilterStore((s) => s.sort);
  const trendingOnly = useMarketsFilterStore((s) => s.trendingOnly);
  const minLiquidityUsd = useMarketsFilterStore((s) => s.minLiquidityUsd);
  const minVolumeUsd = useMarketsFilterStore((s) => s.minVolumeUsd);
  const viewMode = useMarketsFilterStore((s) => s.viewMode);
  const reset = useMarketsFilterStore((s) => s.reset);
  const setExplorerFeed = useMarketsFilterStore((s) => s.setExplorerFeed);

  const all = useMemo(() => data ?? [], [data]);

  const allIds = useMemo(() => all.map((m) => m.id), [all]);
  const { liveSet } = useLiveMarketStatus(allIds);

  const hotNarratives = useMemo(() => {
    return [...all]
      .filter((m) => m.status === "OPEN")
      .sort((a, b) => (b.volumeUsd ?? 0) - (a.volumeUsd ?? 0))
      .slice(0, 14);
  }, [all]);

  const filterBase = useMemo(
    () =>
      ({
        searchTerm: search,
        minLiquidityUsd,
        minVolumeUsd,
      }) as const,
    [search, minLiquidityUsd, minVolumeUsd],
  );

  // ── Per-category counts respect search + trending toggle so the rail
  // ── reflects the dataset the user is currently zoomed into.
  const counts = useMemo(() => {
    const next: Record<string, number> = {};
    for (const cat of MARKET_CATEGORIES) {
      next[cat.slug] = filterMarkets(all, {
        ...filterBase,
        category: cat.slug,
      }).length;
    }
    return next;
  }, [all, filterBase]);

  const totalForAll = useMemo(
    () =>
      filterMarkets(all, {
        ...filterBase,
        category: "all",
      }).length,
    [all, filterBase],
  );

  const ranked = useMemo(() => {
    const filtered = filterMarkets(all, {
      ...filterBase,
      category,
    });
    return sortMarkets(filtered, sort, {
      preferLive: trendingOnly,
      liveSet,
    });
  }, [all, filterBase, category, sort, trendingOnly, liveSet]);

  const sidebarMovers = useMemo(() => {
    return [...ranked]
      .filter((m) => m.status === "OPEN")
      .sort((a, b) => (b.volumeUsd ?? 0) - (a.volumeUsd ?? 0))
      .slice(0, 8);
  }, [ranked]);

  // ── Infinite scroll slicing.
  const { visible, hasMore, loadMore } = usePagedSlice(ranked, PAGE_SIZE);

  const { sentinelRef } = useInfiniteScroll<HTMLDivElement>({
    hasMore,
    onLoadMore: loadMore,
    disabled: feedLoading,
  });

  // Scroll to top when filters change — skip the first hydration pass from URL/store.
  const skipScrollRef = useRef(true);
  useEffect(() => {
    if (skipScrollRef.current) {
      skipScrollRef.current = false;
      return;
    }
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    }
  }, [search, category, sort, trendingOnly, minLiquidityUsd, minVolumeUsd, explorerFeed]);

  const updatedAtLabel = useMemo(() => {
    if (!dataUpdatedAt) return null;
    const ms = Date.now() - dataUpdatedAt;
    if (ms < 1000) return "now";
    if (ms < 60_000) return `${Math.floor(ms / 1000)}s ago`;
    return `${Math.floor(ms / 60_000)}m ago`;
  }, [dataUpdatedAt]);

  const onRefresh = () => invalidateMarketsFeed(qc);

  const liveCount = useMemo(
    () => visible.filter((m) => liveSet.has(m.id)).length,
    [visible, liveSet],
  );

  const rankedLiveCount = useMemo(
    () => ranked.filter((m) => liveSet.has(m.id)).length,
    [ranked, liveSet],
  );

  const empty = !feedLoading && !isError && ranked.length === 0;
  const showingCount = visible.length;
  const totalCount = ranked.length;

  const gridAnimKey = `${explorerFeed}|${search}|${category}|${sort}|${trendingOnly}|${minLiquidityUsd}|${minVolumeUsd}|${viewMode}`;

  return (
    <Section spacing="tight" width="2xl">
      <Stack gap="lg">
        {/* ──────────────────────────────── header */}
        <header className="flex flex-col gap-r16 border-b border-[var(--hub-border)] pb-r16 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h1 className="text-balance text-lg font-semibold tracking-tight text-[var(--hub-fg)] sm:text-xl">
                Market
              </h1>
              {updatedAtLabel ? (
                <span className="font-mono text-[10px] text-[var(--hub-muted)]">
                  feed · updated {updatedAtLabel}
                </span>
              ) : (
                <span className="font-mono text-[10px] text-[var(--hub-muted)]/80">live explorer</span>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-r16">
            <button
              type="button"
              onClick={onRefresh}
              disabled={isFetching}
              aria-label="Refresh markets"
              className={cn(
                "inline-flex h-8 w-8 items-center justify-center rounded-md bg-[var(--hub-bg-subtle)] text-[var(--hub-muted)] ring-1 ring-[var(--hub-border)] transition",
                "hover:bg-[var(--hub-primary-soft)] hover:text-[var(--hub-fg)]",
                "disabled:cursor-not-allowed disabled:opacity-60",
              )}
            >
              <RefreshCw
                className={cn("h-3.5 w-3.5", isFetching && "animate-spin")}
              />
            </button>
            <Link
              href={ROUTES.marketCreate}
              className="inline-flex h-9 items-center gap-1 rounded-lg bg-[var(--hub-primary-soft)] px-3 text-[11.5px] font-semibold text-[var(--hub-fg)] ring-1 ring-[var(--hub-border-strong)] transition hover:bg-[var(--hub-primary)]/25"
            >
              <Plus className="h-3.5 w-3.5" />
              Create market
            </Link>
          </div>
        </header>

        {explorerFeed === "cross_hot" ?
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--hub-border-strong)] bg-[var(--hub-primary-soft)] px-4 py-3 text-[12px] text-[var(--hub-fg)]">
            <span>
              Showing <strong className="font-semibold">cross-hot</strong> — crypto-linked momentum from the
              server-ranked feed. Category and search still refine this slice.
            </span>
            <button
              type="button"
              className="shrink-0 rounded-md bg-[var(--hub-card)] px-3 py-1.5 text-[11px] font-semibold ring-1 ring-[var(--hub-border)] transition hover:bg-[var(--hub-card-hover)]"
              onClick={() => setExplorerFeed(null)}
            >
              Full directory
            </button>
          </div>
        : null}

        <div className="xl:hidden">
          <MarketsHotNarrativesRail markets={hotNarratives} />
        </div>

        <div className="flex flex-col gap-r24 xl:flex-row xl:items-start xl:gap-r24">
          <div className="flex min-w-0 flex-1 flex-col gap-r16">
            {/* ──────────────────────────────── sticky toolbar + sentiment */}
            <div
              style={appStickyToolbarBleedStyle}
              className={cn(
                "sticky top-[var(--app-topbar-h)] z-30 border-b border-[var(--hub-border)] bg-[var(--hub-chrome)]/95 backdrop-blur-md supports-[backdrop-filter]:backdrop-blur-xl",
              )}
            >
              <Stack gap="xs" className="py-r16">
                <MarketsToolbar
                  totalCount={totalCount}
                  visibleCount={showingCount}
                  liveCount={liveCount}
                  isLoading={feedLoading}
                />
                <MarketsCategoryRail counts={counts} total={totalForAll} isLoading={feedLoading} />
                <MarketsExplorerDiscoveryStrip
                  lensMarkets={ranked}
                  totalLoaded={all.length}
                  liveCount={rankedLiveCount}
                  updatedLabel={updatedAtLabel}
                  isFetching={isFetching}
                  isLoading={feedLoading}
                />
              </Stack>
            </div>

            {/* ──────────────────────────────── content */}
            {isError ? (
              <ErrorPanel onRetry={() => void refetch()} />
            ) : feedLoading ? (
              viewMode === "grid" ? (
                <MarketsExplorerGridSkeleton count={12} />
              ) : (
                <MarketsListSkeleton count={10} />
              )
            ) : empty ? (
              <EmptyState
                onClear={reset}
                hasFilters={
                  search.length > 0 ||
                  category !== "all" ||
                  trendingOnly ||
                  minLiquidityUsd > 0 ||
                  minVolumeUsd > 0 ||
                  Boolean(explorerFeed)
                }
              />
            ) : viewMode === "grid" ? (
              <motion.div
                key={gridAnimKey}
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={reduceMotion ? { duration: 0 } : { duration: 0.2 }}
              >
                <MarketsExplorerGrid markets={visible} />
              </motion.div>
            ) : (
              <ListContainer>
                <AnimatePresence initial={false}>
                  {visible.map((m, i) => (
                    <MarketsListRow
                      key={m.id}
                      market={m}
                      rank={i + 1}
                      isLive={liveSet.has(m.id)}
                    />
                  ))}
                </AnimatePresence>
              </ListContainer>
            )}

            {/* sentinel + load more affordance */}
            {!isError && !feedLoading && !empty ? (
              <div className="flex flex-col items-center gap-r8 pb-r8 pt-r8">
                {hasMore ? (
                  <>
                    <button
                      type="button"
                      onClick={() => loadMore()}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--hub-bg-subtle)] px-3 py-1.5 text-[12px] font-medium text-[var(--hub-fg)] ring-1 ring-[var(--hub-border)] transition hover:bg-[var(--hub-primary-soft)]"
                    >
                      <Loader2 className="h-3.5 w-3.5 opacity-70" />
                      Load more · {totalCount - showingCount} remaining
                    </button>
                    {/* Auto-loading sentinel — when this scrolls into view, the next page fires. */}
                    <div ref={sentinelRef} aria-hidden className="h-1 w-full" />
                  </>
                ) : (
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--hub-muted)]">
                    — End of list ·{" "}
                    <span className="text-[var(--hub-fg)]">{totalCount}</span> markets —
                  </p>
                )}
              </div>
            ) : null}
          </div>

          <MarketsExplorerSidebar
            marketsIndex={all}
            narrativeHot={hotNarratives.slice(0, 10)}
            movers={sidebarMovers}
          />
        </div>
      </Stack>
    </Section>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// helpers

function ListContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-lg border border-[var(--hub-border)] bg-[var(--hub-bg-subtle)]">
      <div className="overflow-x-auto">
        <div className="min-w-[880px]">
          <div className="grid items-center gap-r8 border-b border-[var(--hub-border)] px-r8 py-r16 text-[9px] font-semibold uppercase tracking-[0.16em] text-[var(--hub-muted)] [grid-template-columns:34px_minmax(0,1fr)_minmax(0,11rem)_5.5rem_5rem_4.5rem_2.25rem_5rem]">
            <span>#</span>
            <span>Market</span>
            <span>Probability</span>
            <span>7d</span>
            <span className="text-right">Vol</span>
            <span className="hidden text-right md:block">Liq</span>
            <span />
            <span className="text-right">Closes</span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

function ErrorPanel({ onRetry }: { onRetry: () => void }) {
  return (
    <Container width="md">
      <div className="flex flex-col items-center gap-r16 rounded-xl bg-rose-500/[0.06] px-r16 py-s48 text-center ring-1 ring-rose-400/20">
        <Activity className="h-5 w-5 text-rose-300" />
        <p className="text-[13px] font-medium text-[var(--hub-fg)]">
          Couldn&apos;t load markets
        </p>
        <p className="max-w-sm text-[12px] text-[var(--hub-muted)]">
          The feed might be temporarily unreachable. Retry now or check your
          connection.
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="hub-btn-secondary px-3 py-1.5 text-[12px]"
        >
          Retry
        </button>
      </div>
    </Container>
  );
}

function EmptyState({
  hasFilters,
  onClear,
}: {
  hasFilters: boolean;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-r16 rounded-lg border border-[var(--hub-border)] bg-[var(--hub-bg-subtle)] px-r16 py-s56 text-center">
      <p className="text-[12px] font-medium text-[var(--hub-fg)]">
        No markets match filters.
      </p>
      <p className="max-w-md text-[11px] leading-snug text-[var(--hub-muted)]">
        Clear search, category, live-first toggle, or liquidity/volume floors.
      </p>
      {hasFilters ? (
        <button
          type="button"
          onClick={onClear}
          className="rounded-md bg-[var(--hub-primary-soft)] px-3 py-1.5 text-[12px] font-medium text-[var(--hub-fg)] ring-1 ring-[var(--hub-border)] transition hover:bg-[var(--hub-primary)]/25"
        >
          Reset filters
        </button>
      ) : (
        <Link
          href={ROUTES.marketCreate}
          className="inline-flex items-center gap-1.5 rounded-md bg-[var(--hub-primary-soft)] px-3 py-1.5 text-[12px] font-semibold text-[var(--hub-primary-bright)] ring-1 ring-[var(--hub-border-strong)] transition hover:bg-[var(--hub-primary)]/25"
        >
          <Plus className="h-3.5 w-3.5" />
          Create the first market
        </Link>
      )}
    </div>
  );
}
