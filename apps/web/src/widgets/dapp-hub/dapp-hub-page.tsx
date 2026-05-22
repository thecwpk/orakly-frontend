"use client";

import { useEffect, useMemo, useState } from "react";
import { PrefetchLink } from "@/shared/ui";
import { buildActivityRows } from "@/features/realtime-activity/lib/build-rows";
import { useNotificationsStore } from "@/features/notifications";
import { cn } from "@/lib/utils";
import { useMarketsFeedQuery, useHubMarketsPreviewQuery } from "@/shared/api/hooks";
import { usePrefetchMarketsFeed } from "@/shared/api/prefetch";
import { ROUTES } from "@/shared/constants/routes";
import { appStickyToolbarBleedStyle } from "@/shared/constants/page-layout";
import { useLiveMarketStatus } from "@/widgets/trending-prediction-markets/lib/use-live-market-status";
import { useLiveActivityFeed } from "@/websocket/hooks/useLiveActivityFeed";
import { HubFeaturedTradingCard } from "./components/hub-featured-trading-card";
import { HubHomeMarketTicker } from "./components/hub-home-market-ticker";
import { HubMarketsBrowseBlock } from "./components/hub-markets-browse-block";
import { HubBreakingNewsPanel } from "./components/hub-breaking-hot-topics-stack";
import { HubHotTopicsSlider } from "./components/hub-hot-topics-slider";
import { HubSpotlightCarouselNav } from "./components/hub-spotlight-desk";
import { mergeHubSpotlightMarkets } from "./lib/merge-hub-spotlight-markets";
import { uniqMarkets } from "./lib/uniq-markets";
import "./dapp-hub-home.css";

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

const HUB_MOVERS_RANKING =
  process.env.NEXT_PUBLIC_HUB_MOVERS_RANKING === "1" ||
  process.env.NEXT_PUBLIC_HUB_MOVERS_RANKING?.toLowerCase() === "true";

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
    <div className="flex min-h-0 flex-1 flex-col border-border">
      <div className="flex shrink-0 items-center gap-2 border-b border-border bg-muted/30 px-2 py-1.5">
        <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{kicker}</span>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain font-mono text-[11px] leading-relaxed">
        {rows.map((line, i) => (
          <div key={`${kicker}-${i}`} className="border-b border-border/60 px-2 py-1.5 last:border-b-0 hover:bg-muted/25">
            <span className="select-none text-yes/80">› </span>
            <span className={cn(sparse ? "text-muted-foreground" : "text-foreground/90")}>{line}</span>
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
    <div className="flex h-[248px] max-h-[252px] flex-col divide-y divide-border overflow-hidden rounded-md border border-border bg-card/55 shadow-sm ring-1 ring-border/40">
      <TerminalBand kicker="TRD" lines={tradeLines} emptyHint="Executions stream when venues print." />
      <TerminalBand kicker="WHL" lines={whaleLines} emptyHint={`No prints ≥ ${fmtUsdShort(WHALE_NOTIONAL_USD)} yet.`} />
      <TerminalBand kicker="POS" lines={ledgerLines} emptyHint="Positions & settlements appear here." />
    </div>
  );
}

export function DappHubPage() {
  const prefetchDirectory = usePrefetchMarketsFeed();
  const marketsIndexQ = useMarketsFeedQuery();
  const hubPreview = useHubMarketsPreviewQuery();
  const notifications = useNotificationsStore((s) => s.notifications);
  const tape = useLiveActivityFeed();

  const pack = hubPreview.data;
  const trendingList = useMemo(() => pack?.trendingList ?? [], [pack?.trendingList]);
  const breakingSignals = useMemo(() => pack?.breaking ?? [], [pack?.breaking]);
  const movers24h = useMemo(() => pack?.movers24h ?? [], [pack?.movers24h]);
  const trendingTape = useMemo(() => pack?.trendingTape ?? [], [pack?.trendingTape]);
  const trendingActivity = useMemo(() => pack?.trendingActivity ?? [], [pack?.trendingActivity]);
  const trendingHot = useMemo(() => pack?.trendingHot ?? [], [pack?.trendingHot]);
  const trendingNewTrending = useMemo(() => pack?.trendingNew ?? [], [pack?.trendingNew]);

  const hubLaneQueriesLoading = hubPreview.isLoading && !pack;

  const hubDatabaseDown = hubPreview.isError;
  const hubDatabaseMessage =
    hubPreview.error?.message ??
    "Postgres unreachable on Vercel — fix DATABASE_URL (Neon URL from apps/web/.env.local).";

  const crossLaneHotTopTen = useMemo(() => pack?.hotTopics ?? [], [pack?.hotTopics]);

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
        movers24h,
        breakingSignals,
        trendingTape,
        trendingList,
        trendingActivity,
        trendingHot,
        trendingNewTrending,
      ]).map((m) => m.id),
    [
      featuredFive,
      movers24h,
      breakingSignals,
      trendingTape,
      trendingList,
      trendingActivity,
      trendingHot,
      trendingNewTrending,
    ],
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

  const spotlightSkeleton =
    featuredFive.length === 0 && hubPreview.isPending && !pack && !hubDatabaseDown;

  const breakingDisplayMarkets = useMemo(() => {
    if (HUB_MOVERS_RANKING && movers24h.length > 0) return movers24h;
    if (breakingSignals.length > 0) return breakingSignals;
    return trendingActivity;
  }, [movers24h, breakingSignals, trendingActivity]);

  const breakingRailMode = useMemo(() => {
    if (HUB_MOVERS_RANKING && movers24h.length > 0) return "movers_24h" as const;
    if (breakingSignals.length > 0) return "live_signals" as const;
    return "liquidity_movers" as const;
  }, [movers24h, breakingSignals]);

  const breakingPanelLoading =
    !breakingDisplayMarkets.length && hubPreview.isPending && !pack && !hubDatabaseDown;

  const breakingPanelProps = {
    breakingMarkets: breakingDisplayMarkets,
    excludeId: spotlightExcludeId,
    liveSet,
    loadingBreaking: breakingPanelLoading,
    railMode: breakingRailMode,
    moreHref: ROUTES.marketsBreaking,
  };

  const hotSliderLoading = hubLaneQueriesLoading && crossLaneHotTopTen.length === 0;

  const asideSurfaceClass = "mb-aside-surface overflow-hidden rounded-2xl";

  return (
    <div className="mb-root hub-app-canvas pb-[max(1rem,env(safe-area-inset-bottom,0px))] lg:pb-2">
      {hubDatabaseDown ? (
        <div
          role="alert"
          className="mx-auto mb-4 max-w-3xl rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-center text-sm text-destructive"
        >
          <p className="font-semibold">Database not connected</p>
          <p className="mt-1 text-xs text-destructive/90">{hubDatabaseMessage}</p>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Vercel → Environment Variables → Production: paste{" "}
            <code className="rounded bg-muted px-1">DATABASE_URL</code> from{" "}
            <code className="rounded bg-muted px-1">apps/web/.env.local</code>, then redeploy.
          </p>
        </div>
      ) : null}
      <HubHomeMarketTicker markets={trendingTape} />

      <div className="mb-shell">
        <div className="mb-main">
          <section className="scroll-mt-4 flex min-h-0 min-w-0 flex-1 flex-col">
            {spotlightSkeleton ? (
              <div className="mb-hero mb-hero-grid flex min-h-0 min-w-0 flex-1 flex-col space-y-4">
                <div className="h-10 animate-pulse rounded-lg bg-white/[0.05]" />
                <div className="min-h-[min(52vh,420px)] flex-1 animate-pulse rounded-lg bg-white/[0.05]" />
                <div className="min-[1100px]:hidden">
                  <HubBreakingNewsPanel {...breakingPanelProps} className={asideSurfaceClass} />
                </div>
              </div>
            ) : spotlightMarket ? (
              <div className="mb-hero mb-hero-grid flex min-h-0 min-w-0 flex-1 flex-col space-y-6">
                <div className="mb-hero-desk-unified flex min-h-[min(52vh,420px)] min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[0_20px_60px_-28px_hsl(228_45%_4%/0.4)] ring-1 ring-border/50">
                  <HubFeaturedTradingCard
                    market={spotlightMarket}
                    isLive={liveSet.has(spotlightMarket.id)}
                    queueMerged
                  />
                  <HubSpotlightCarouselNav
                    markets={featuredFive}
                    index={spotlightIdx}
                    onChange={setSpotlightIdx}
                    mergedUnderFeatured
                  />
                </div>
                <div className="min-[1100px]:hidden">
                  <HubBreakingNewsPanel {...breakingPanelProps} className={asideSurfaceClass} />
                </div>
              </div>
            ) : hubDatabaseDown ? (
              <div className="mb-hero mb-hero-grid flex min-h-0 min-w-0 flex-1 flex-col space-y-5">
                <p className={cn(panel, "px-3 py-4 text-center text-[11px] text-destructive")}>
                  Markets unavailable — database not connected on server.
                </p>
                <div className="min-[1100px]:hidden">
                  <HubBreakingNewsPanel {...breakingPanelProps} className={asideSurfaceClass} />
                </div>
              </div>
            ) : (
              <div className="mb-hero mb-hero-grid flex min-h-0 min-w-0 flex-1 flex-col space-y-5">
                <p className={cn(panel, "px-3 py-4 text-center text-[11px] text-muted-foreground")}>
                  Feed syncing… (waiting for markets in database)
                </p>
                <div className="min-[1100px]:hidden">
                  <HubBreakingNewsPanel {...breakingPanelProps} className={asideSurfaceClass} />
                </div>
              </div>
            )}
          </section>
        </div>

        <aside className="mb-aside hidden min-h-0 min-[1100px]:flex min-[1100px]:flex-col">
          <HubBreakingNewsPanel {...breakingPanelProps} className={cn(asideSurfaceClass, "min-h-0 flex-1")} />
        </aside>
      </div>

      <div className="mb-hot-topics-bleed" style={appStickyToolbarBleedStyle}>
        <HubHotTopicsSlider hotMarkets={crossLaneHotTopTen} loadingHot={hotSliderLoading} />
      </div>

      <div
        className="mb-live-markets-bleed scroll-mt-4 border-t border-border/70 pt-8 min-[1100px]:pt-10"
        style={appStickyToolbarBleedStyle}
      >
        <HubMarketsBrowseBlock
          liveSet={liveSet}
          trendingList={trendingList}
          trendingTape={trendingTape}
          trendingActivity={trendingActivity}
          trendingHot={trendingHot}
          trendingNewTrending={trendingNewTrending}
          loadingTrendingList={hubLaneQueriesLoading}
          loadingTrendingTape={hubLaneQueriesLoading}
          loadingTrendingActivity={hubLaneQueriesLoading}
          loadingTrendingHot={hubLaneQueriesLoading}
          loadingTrendingNew={hubLaneQueriesLoading}
          onPrefetchDirectory={() => prefetchDirectory()}
        />
      </div>

      <footer className="mb-shell-footer mt-2 border-t border-border/70 bg-muted/[0.06] pt-8 pb-10 lg:pb-12">
        <div className="pb-2 pt-0">
          <details className="group rounded-xl border border-border bg-card/55 shadow-sm ring-1 ring-border/50 [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2.5 font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground transition hover:bg-muted/30 hover:text-foreground">
              <span>Live desk · terminal tape</span>
              <span className="text-muted-foreground/70 group-open:rotate-180 motion-safe:transition-transform">▼</span>
            </summary>
            <div className="border-t border-border px-1 pb-3 pt-3">
              <div className="mb-3 flex flex-wrap items-start justify-between gap-2 px-0.5">
                <p className="max-w-xl text-[11px] leading-relaxed text-muted-foreground">
                  Executions · whales · ledger — dense terminal read.
                </p>
                <PrefetchLink href={ROUTES.activity} className="shrink-0 font-mono text-[9px] text-muted-foreground hover:text-foreground">
                  Activity →
                </PrefetchLink>
              </div>
              <TerminalLiveBands tradeLines={tradeLines} whaleLines={whaleLines} ledgerLines={ledgerLines} />
            </div>
          </details>
        </div>

        <div className="mb-hub-footer-band mt-6 rounded-lg border border-border/80 bg-card/40 px-4 py-3 text-center ring-1 ring-border/35">
          <p className="text-[11px] font-medium leading-relaxed text-foreground/90">
            Markets involve risk; prices reflect consensus not advice.
          </p>
          <p className="mt-1 font-mono text-[9px] text-muted-foreground">Orakly · Trading hub</p>
        </div>
      </footer>
    </div>
  );
}
