"use client";

import { useEffect, useMemo, useState } from "react";
import { PrefetchLink } from "@/shared/ui";
import { buildActivityRows } from "@/features/realtime-activity/lib/build-rows";
import { useNotificationsStore } from "@/features/notifications";
import { cn } from "@/lib/utils";
import { useMarketsFeedQuery, useMarketsFeedScopedQuery } from "@/shared/api/hooks";
import { usePrefetchMarketsFeed } from "@/shared/api/prefetch";
import { ROUTES } from "@/shared/constants/routes";
import { useLiveMarketStatus } from "@/widgets/trending-prediction-markets/lib/use-live-market-status";
import { useLiveActivityFeed } from "@/websocket/hooks/useLiveActivityFeed";
import { HubFeaturedTradingCard } from "./components/hub-featured-trading-card";
import { HubMarketsBrowseBlock } from "./components/hub-markets-browse-block";
import { HubBreakingHotTopicsStack } from "./components/hub-breaking-hot-topics-stack";
import { HubSpotlightCarouselNav } from "./components/hub-spotlight-desk";
import { pickCrossLaneHotMarkets } from "./lib/hub-cross-lane-hot-topics";
import { mergeHubSpotlightMarkets } from "./lib/merge-hub-spotlight-markets";
import { uniqMarkets } from "./lib/uniq-markets";

const panel = "surface-terminal rounded-md shadow-none";

const WHALE_NOTIONAL_USD = 3_500;

const LEDGER_VARIANTS = new Set([
  "POSITION_OPENED",
  "PAYOUT",
  "PORTFOLIO_REFRESH",
  "MARKET_RESOLVED",
  "MARKET_CREATED",
  "MARKET_CLOSED",
]);

function fmtUsdShort(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "—";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 10_000) return `$${(n / 1_000).toFixed(1)}k`;
  return `$${Math.round(n).toLocaleString()}`;
}

function TerminalBand({
  kicker,
  lines,
  emptyHint,
}: {
  kicker: string;
  lines: string[];
  emptyHint: string;
}) {
  const sparse = lines.length === 0;
  const rows = lines.length ? lines.slice(0, 52) : [emptyHint];
  return (
    <div className="flex min-h-0 flex-1 flex-col border-app-subtle">
      <div className="flex shrink-0 items-center gap-2 border-b border-white/[0.08] bg-black/45 px-2 py-1">
        <span className="font-mono text-[8px] font-semibold uppercase tracking-[0.12em] text-zinc-400">{kicker}</span>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain font-mono text-[10px] leading-relaxed">
        {rows.map((line, i) => (
          <div key={`${kicker}-${i}`} className="border-b border-white/[0.04] px-2 py-1.5 last:border-b-0 hover:bg-white/[0.03]">
            <span className="select-none text-emerald-600/80">› </span>
            <span className={cn(sparse ? "text-zinc-400" : "text-zinc-300")}>{line}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TerminalLiveBands({
  tradeLines,
  whaleLines,
  ledgerLines,
}: {
  tradeLines: string[];
  whaleLines: string[];
  ledgerLines: string[];
}) {
  return (
    <div className={cn(panel, "flex h-[248px] max-h-[252px] flex-col divide-y divide-white/[0.08] overflow-hidden rounded-md ring-1 ring-white/[0.08] bg-black/20")}>
      <TerminalBand kicker="TRD" lines={tradeLines} emptyHint="Executions stream when venues print." />
      <TerminalBand kicker="WHL" lines={whaleLines} emptyHint={`No prints ≥ ${fmtUsdShort(WHALE_NOTIONAL_USD)} yet.`} />
      <TerminalBand kicker="POS" lines={ledgerLines} emptyHint="Positions & settlements appear here." />
    </div>
  );
}

export function DappHubPage() {
  const [hubSecondaryLanesReady, setHubSecondaryLanesReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let ricId: ReturnType<typeof requestIdleCallback> | undefined;
    let rafOuter = 0;
    let rafInner = 0;

    if (typeof requestIdleCallback !== "undefined") {
      ricId = requestIdleCallback(
        () => {
          if (!cancelled) setHubSecondaryLanesReady(true);
        },
        { timeout: 480 },
      );
    } else {
      rafOuter = requestAnimationFrame(() => {
        rafInner = requestAnimationFrame(() => {
          if (!cancelled) setHubSecondaryLanesReady(true);
        });
      });
    }

    return () => {
      cancelled = true;
      if (ricId !== undefined) cancelIdleCallback(ricId);
      if (rafOuter) cancelAnimationFrame(rafOuter);
      if (rafInner) cancelAnimationFrame(rafInner);
    };
  }, []);

  const prefetchDirectory = usePrefetchMarketsFeed();
  const marketsIndexQ = useMarketsFeedQuery();
  const notifications = useNotificationsStore((s) => s.notifications);
  const tape = useLiveActivityFeed();

  const trendingListQ = useMarketsFeedScopedQuery({
    scope: "hub",
    lane: "list",
    filter: "trending",
    take: 28,
  });
  const trendingTapeQ = useMarketsFeedScopedQuery({
    scope: "hub",
    lane: "trending",
    trendingBy: "volume",
    take: 28,
    enabled: hubSecondaryLanesReady,
  });
  const trendingActivityQ = useMarketsFeedScopedQuery({
    scope: "hub",
    lane: "trending",
    trendingBy: "activity",
    take: 28,
    enabled: hubSecondaryLanesReady,
  });
  const trendingHotQ = useMarketsFeedScopedQuery({
    scope: "hub",
    lane: "trending",
    trendingBy: "hot",
    take: 28,
    enabled: hubSecondaryLanesReady,
  });
  const trendingNewTrendingQ = useMarketsFeedScopedQuery({
    scope: "hub",
    lane: "trending",
    trendingBy: "new",
    take: 28,
    enabled: hubSecondaryLanesReady,
  });

  const trendingList = useMemo(() => trendingListQ.data ?? [], [trendingListQ.data]);
  const trendingTape = useMemo(() => trendingTapeQ.data ?? [], [trendingTapeQ.data]);
  const trendingActivity = useMemo(() => trendingActivityQ.data ?? [], [trendingActivityQ.data]);
  const trendingHot = useMemo(() => trendingHotQ.data ?? [], [trendingHotQ.data]);
  const trendingNewTrending = useMemo(() => trendingNewTrendingQ.data ?? [], [trendingNewTrendingQ.data]);

  const hubLaneQueriesLoading =
    trendingListQ.isLoading ||
    (hubSecondaryLanesReady &&
      (trendingTapeQ.isLoading ||
        trendingActivityQ.isLoading ||
        trendingHotQ.isLoading ||
        trendingNewTrendingQ.isLoading));

  const crossLaneHotTopTen = useMemo(
    () =>
      pickCrossLaneHotMarkets(
        [trendingList, trendingTape, trendingActivity, trendingHot, trendingNewTrending],
        10,
      ),
    [trendingList, trendingTape, trendingActivity, trendingHot, trendingNewTrending],
  );

  const featuredFive = useMemo(
    () =>
      mergeHubSpotlightMarkets(
        trendingList,
        trendingTape,
        trendingActivity,
        trendingHot,
        trendingNewTrending,
      ),
    [trendingList, trendingTape, trendingActivity, trendingHot, trendingNewTrending],
  );

  const [spotlightIdx, setSpotlightIdx] = useState(0);

  useEffect(() => {
    if (!featuredFive.length) {
      setSpotlightIdx(0);
      return;
    }
    setSpotlightIdx((i) => Math.min(i, featuredFive.length - 1));
  }, [featuredFive.length]);

  useEffect(() => {
    if (featuredFive.length <= 1) return;
    const id = window.setInterval(() => {
      setSpotlightIdx((i) => (i + 1) % featuredFive.length);
    }, 9000);
    return () => window.clearInterval(id);
  }, [featuredFive.length]);

  const hubIds = useMemo(
    () =>
      uniqMarkets([
        featuredFive,
        trendingTape,
        trendingList,
        trendingActivity,
        trendingHot,
        trendingNewTrending,
      ]).map((m) => m.id),
    [featuredFive, trendingTape, trendingList, trendingActivity, trendingHot, trendingNewTrending],
  );
  const { liveSet } = useLiveMarketStatus(hubIds);

  const { trades, updates } = useMemo(
    () =>
      buildActivityRows({
        feed: tape,
        notifications,
        markets: marketsIndexQ.data,
        maxRows: 120,
      }),
    [tape, notifications, marketsIndexQ.data],
  );

  const tradeLines = useMemo(() => {
    return trades.slice(0, 24).map((t) => {
      const title = t.market?.title ?? "Market";
      const short = title.length > 42 ? `${title.slice(0, 40)}…` : title;
      return `${t.side} ${t.outcome} · ${short} · ${fmtUsdShort(t.notionalUsd)}`;
    });
  }, [trades]);

  const whaleLines = useMemo(() => {
    return trades
      .filter((t) => t.notionalUsd >= WHALE_NOTIONAL_USD)
      .slice(0, 18)
      .map((t) => {
        const title = t.market?.title ?? "Market";
        const short = title.length > 36 ? `${title.slice(0, 34)}…` : title;
        return `★ ${fmtUsdShort(t.notionalUsd)} · ${t.side} ${t.outcome} · ${short}`;
      });
  }, [trades]);

  const ledgerLines = useMemo(() => {
    return updates
      .filter((u) => LEDGER_VARIANTS.has(u.variant))
      .slice(0, 20)
      .map((u) => {
        const title = u.market?.title ?? "";
        const tail = title.length > 28 ? `${title.slice(0, 26)}…` : title;
        return `${u.variant.replaceAll("_", " ")}${tail ? ` · ${tail}` : ""}`;
      });
  }, [updates]);

  const spotlightMarket = featuredFive[spotlightIdx];
  const spotlightExcludeId = spotlightMarket?.id;
  const secondaryLanesPending =
    hubSecondaryLanesReady &&
    (trendingTapeQ.isPending ||
      trendingActivityQ.isPending ||
      trendingHotQ.isPending ||
      trendingNewTrendingQ.isPending);

  const spotlightSkeleton =
    featuredFive.length === 0 &&
    (trendingListQ.isPending || secondaryLanesPending);

  const breakingHotStackProps = {
    breakingMarkets: trendingTape,
    hotMarkets: crossLaneHotTopTen,
    excludeId: spotlightExcludeId,
    liveSet,
    loadingBreaking: trendingTapeQ.isLoading,
    loadingHot: hubLaneQueriesLoading && crossLaneHotTopTen.length === 0,
  };

  return (
    <div className="min-h-[calc(100dvh-var(--app-topbar-h))] min-w-0 w-full max-w-full">
      <div className="mx-auto w-full min-w-0 max-w-[min(1420px,100%)] pb-16 pt-4 lg:pb-20">
        <div className="space-y-app-section">
          {/* ── 1 · Trader desk — main spotlight + right rails (Polymarket-adjacent, Orakly execution layer) ── */}
          <section className="scroll-mt-4">
            {spotlightSkeleton ? (
              <div className="min-w-0 space-y-4">
                <div className="h-10 animate-pulse rounded-lg bg-white/[0.05]" />
                <div className="min-h-[min(52vh,420px)] animate-pulse rounded-lg bg-white/[0.05]" />
                <HubBreakingHotTopicsStack {...breakingHotStackProps} />
              </div>
            ) : spotlightMarket ? (
              <div className="space-y-6">
                <div className="grid w-full min-w-0 max-w-full items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(260px,300px)] lg:gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(272px,320px)]">
                  <div className="min-w-0 max-w-full space-y-3">
                    <HubFeaturedTradingCard
                      market={spotlightMarket}
                      isLive={liveSet.has(spotlightMarket.id)}
                    />
                    <HubSpotlightCarouselNav
                      markets={featuredFive}
                      index={spotlightIdx}
                      onChange={setSpotlightIdx}
                    />
                  </div>

                  <aside className="hidden min-w-0 lg:block lg:sticky lg:top-[calc(var(--app-topbar-h)+12px)] lg:self-start">
                    <HubBreakingHotTopicsStack {...breakingHotStackProps} />
                  </aside>
                </div>

                <div className="lg:hidden">
                  <HubBreakingHotTopicsStack {...breakingHotStackProps} />
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <p className={cn(panel, "px-3 py-4 text-center text-[11px] text-zinc-500")}>Feed syncing…</p>
                <HubBreakingHotTopicsStack {...breakingHotStackProps} />
              </div>
            )}
          </section>

          {/* ── 2 · All markets — directory (clear break from desk above) ── */}
          <section className="scroll-mt-4 border-t border-white/[0.05] pt-8 lg:pt-10">
            <HubMarketsBrowseBlock
              liveSet={liveSet}
              trendingList={trendingList}
              trendingTape={trendingTape}
              trendingActivity={trendingActivity}
              trendingHot={trendingHot}
              trendingNewTrending={trendingNewTrending}
              loadingTrendingList={trendingListQ.isLoading}
              loadingTrendingTape={trendingTapeQ.isLoading}
              loadingTrendingActivity={trendingActivityQ.isLoading}
              loadingTrendingHot={trendingHotQ.isLoading}
              loadingTrendingNew={trendingNewTrendingQ.isLoading}
              onPrefetchDirectory={() => prefetchDirectory()}
            />
          </section>
        </div>

        {/* Live desk — tucked away (collapsed by default) */}
        <div className="mx-auto w-full min-w-0 max-w-[min(1420px,100%)] pb-6">
          <details className="group rounded-lg border border-white/[0.06] bg-black/25 ring-1 ring-white/[0.04] [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2.5 font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-zinc-500 transition hover:bg-white/[0.03] hover:text-zinc-400">
              <span>Live desk · terminal tape</span>
              <span className="text-zinc-600 group-open:rotate-180 motion-safe:transition-transform">▼</span>
            </summary>
            <div className="border-t border-white/[0.06] px-1 pb-3 pt-3">
              <div className="mb-3 flex flex-wrap items-start justify-between gap-2 px-0.5">
                <p className="max-w-xl text-[11px] leading-relaxed text-zinc-500">
                  Executions · whales · ledger — dense terminal read.
                </p>
                <PrefetchLink href={ROUTES.activity} className="shrink-0 font-mono text-[9px] text-zinc-600 hover:text-zinc-400">
                  Activity →
                </PrefetchLink>
              </div>
              <TerminalLiveBands tradeLines={tradeLines} whaleLines={whaleLines} ledgerLines={ledgerLines} />
            </div>
          </details>
        </div>

        <p className="mx-auto mt-4 max-w-[min(1420px,100%)] border-t border-app-subtle pt-4 text-[10px] leading-relaxed text-zinc-600 lg:mt-6 lg:pt-5">
          Markets involve risk; prices reflect consensus not advice.
        </p>
      </div>
    </div>
  );
}
