"use client";

import type { Market } from "@orakly/types";
import { Loader2, RefreshCw } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { MARKET_CATEGORIES } from "@/features/markets/lib/categories";
import { cn } from "@/lib/utils";
import { fetchMarketsFeedScoped } from "@/shared/api/fetchers/markets-feed";
import { useDiscoveryMarketsQuery } from "@/shared/api/hooks/use-discovery-markets-query";
import { resolveMarketsScopedTake } from "@/shared/api/hooks/useMarketsFeedScopedQuery";
import { queryKeys } from "@/shared/api/query-keys";
import { filterMarkets } from "@/widgets/markets-explorer/lib/filter-and-sort";
import {
  TrendingMarketCard,
  TrendingMarketGridSkeleton,
} from "@/widgets/trending-prediction-markets";
import { useLiveMarketStatus } from "@/widgets/trending-prediction-markets/lib/use-live-market-status";
import {
  discoverTabToFeedParams,
  type DiscoverTab,
} from "./lib/discover-client-lanes";

const TABS: { id: DiscoverTab; label: string; hint?: string }[] = [
  { id: "all", label: "All markets", hint: "Directory" },
  { id: "list_trending", label: "Trending" },
  { id: "list_new", label: "New listings" },
  { id: "cross_hot", label: "Cross-hot", hint: "Multi-API" },
  { id: "breaking", label: "Breaking", hint: "Live signals" },
  { id: "vol", label: "Volume" },
  { id: "activity", label: "Activity" },
  { id: "hot", label: "Hot" },
  { id: "new_trend", label: "Fresh" },
  { id: "alpha", label: "Alpha" },
];

const ACCENTS = ["cyan", "violet", "emerald", "rose", "amber"] as const;

export function MarketingDiscoverPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<DiscoverTab>("all");
  const [category, setCategory] = useState<string>("all");
  const [search, setSearch] = useState("");

  const prefetchLane = useCallback(
    (tid: DiscoverTab) => {
      const params = discoverTabToFeedParams(tid);
      const trendingBy =
        params.lane === "trending" ? (params.trendingBy ?? "volume") : "";
      const filter =
        params.lane === "list" ? (params.filter ?? "all") : "";
      const take = resolveMarketsScopedTake(params);

      void queryClient.prefetchQuery({
        queryKey: queryKeys.markets.feedScoped({
          scope: params.scope,
          lane: params.lane,
          trendingBy,
          filter,
          take,
        }),
        queryFn: () =>
          fetchMarketsFeedScoped({
            ...params,
            trendingBy:
              params.lane === "trending"
                ? (params.trendingBy ?? "volume")
                : undefined,
            filter:
              params.lane === "list"
                ? (params.filter ?? "all")
                : undefined,
            take,
          }),
        staleTime: 3 * 60_000,
      });
    },
    [queryClient],
  );

  const feedParams = useMemo(() => discoverTabToFeedParams(tab), [tab]);
  const marketsQ = useDiscoveryMarketsQuery(feedParams);

  const laneMarkets = useMemo(() => marketsQ.data ?? [], [marketsQ.data]);

  const filtered = useMemo(
    () =>
      filterMarkets(laneMarkets, {
        searchTerm: search,
        category,
        trendingOnly: false,
        liveSet: new Set(),
        minLiquidityUsd: 0,
        minVolumeUsd: 0,
      }),
    [laneMarkets, search, category],
  );

  const ids = useMemo(() => filtered.map((m) => m.id), [filtered]);
  const { liveSet, lastTradeAt } = useLiveMarketStatus(ids);

  const displayMarkets = filtered;

  const volumeMax = useMemo(
    () => displayMarkets.reduce((acc, m) => Math.max(acc, m.volumeUsd ?? 0), 0),
    [displayMarkets],
  );

  const isLoading = marketsQ.isPending && !laneMarkets.length;

  const isFetching = marketsQ.isFetching;
  const isError = marketsQ.isError;

  const dataUpdatedAt = marketsQ.dataUpdatedAt;

  const updatedLabel = useMemo(() => {
    if (!dataUpdatedAt) return null;
    const ms = Date.now() - dataUpdatedAt;
    if (ms < 1500) return "just now";
    if (ms < 60_000) return `${Math.floor(ms / 1000)}s ago`;
    return `${Math.floor(ms / 60_000)}m ago`;
  }, [dataUpdatedAt]);

  const refetchAll = () => {
    void marketsQ.refetch();
  };

  return (
    <div className="marketing-discover min-w-0 bg-gradient-to-b from-background via-background to-muted/20 text-foreground">
      <div className="mx-auto max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
        <header className="mb-8 border-b border-border/60 pb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Discover
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                Markets directory
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
                Each lane matches the live server ranking (trending, new, volume, activity, hot).
                Switch tabs to load that feed — prior results stay visible while the next lane loads.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void refetchAll()}
              disabled={isFetching}
              aria-label="Refresh markets"
              title="Refresh markets from server"
              className="inline-flex h-10 shrink-0 items-center justify-center gap-2 self-start rounded-lg border border-border bg-card/90 px-4 text-sm font-medium text-foreground shadow-sm transition hover:bg-muted/40 disabled:opacity-50 sm:self-auto"
            >
              {isFetching ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
              )}
              Refresh
            </button>
          </div>

          <div
            className="mt-6 flex min-w-0 gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            role="tablist"
            aria-label="Market lanes"
          >
            {TABS.map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onMouseEnter={() => prefetchLane(t.id)}
                  onFocus={() => prefetchLane(t.id)}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "shrink-0 rounded-full border px-3.5 py-2 text-left text-[13px] font-medium transition",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yes/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    active
                      ? "border-yes/45 bg-yes/12 text-foreground shadow-[0_0_20px_-8px_color-mix(in_srgb,var(--yes)_40%,transparent)]"
                      : "border-border/80 bg-card/50 text-muted-foreground hover:border-border hover:bg-card hover:text-foreground",
                  )}
                >
                  {t.label}
                  {t.hint ? (
                    <span className="ml-1.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                      {t.hint}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </header>

        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-1 flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCategory("all")}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-xs font-medium transition",
                category === "all"
                  ? "border-yes/40 bg-yes/10 text-foreground"
                  : "border-border bg-card/60 text-muted-foreground hover:bg-muted/30",
              )}
            >
              All categories
            </button>
            {MARKET_CATEGORIES.map((c) => (
              <button
                key={c.slug}
                type="button"
                onClick={() => setCategory(c.slug)}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-xs font-medium transition",
                  category === c.slug
                    ? "border-yes/40 bg-yes/10 text-foreground"
                    : "border-border bg-card/60 text-muted-foreground hover:bg-muted/30 hover:text-foreground",
                )}
              >
                {c.name}
              </button>
            ))}
          </div>
          <label className="block w-full min-w-0 lg:max-w-sm">
            <span className="sr-only">Search markets</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title…"
              className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none ring-0 placeholder:text-muted-foreground focus:border-yes/40"
            />
          </label>
        </div>

        <p className="mb-8 font-mono text-[10px] text-muted-foreground">
          {isError ? "Could not load markets." : null}
          {!isError && updatedLabel ? <>Updated {updatedLabel}</> : null}
        </p>

        <section aria-label="Markets">
          {isLoading ? (
            <TrendingMarketGridSkeleton count={9} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {displayMarkets.map((m: Market, i: number) => (
                <TrendingMarketCard
                  key={m.id}
                  market={m}
                  index={i}
                  accent={ACCENTS[i % ACCENTS.length]!}
                  volumeMax={volumeMax}
                  isLive={liveSet.has(m.id)}
                  lastTradeAt={lastTradeAt.get(m.id)}
                  directoryStyle
                  chrome="subtle"
                />
              ))}
            </div>
          )}
          {!isLoading && displayMarkets.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border bg-card/40 p-10 text-center text-sm text-muted-foreground">
              No markets match these filters. Try another lane or clear search.
            </p>
          ) : null}
        </section>
      </div>
    </div>
  );
}
