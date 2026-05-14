"use client";

import type { Market } from "@orakly/types";
import { notFound, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import {
  useMarketOddsQuery,
  useMarketOddsRealtimeInvalidation,
  useMarketsFeedQuery,
  useTradingQueriesSync,
} from "@/shared/api/hooks";
import { useAuthStore } from "@/state/stores/auth.store";
import { useMarketRealtime } from "@/websocket/hooks/useMarketRealtime";
import { useMarketRoom } from "@/websocket/socket-registry";
import { MarketActivityFeed } from "./components/market-activity-feed";
import { MarketChartPanel } from "./components/market-chart-panel";
import { MarketComments } from "./components/market-comments";
import { MarketDetailsHeader } from "./components/market-details-header";
import { MarketDetailsSkeleton } from "./components/market-details-skeleton";
import { MarketNewsPanel } from "./components/market-news-panel";
import { MarketOrderBook } from "./components/market-order-book";
import { MarketRealtimeStrip } from "./components/market-realtime-strip";
import { MarketRelated } from "./components/market-related";
import { MarketTradingDesk } from "./components/market-trading-desk";
import { MarketVolumeChart } from "./components/market-volume-chart";
import { isUuid } from "./lib/is-uuid";
import { mergeMidYes, mergeYesNoDisplay } from "./lib/merge-odds";
import type { TradeModalMarket } from "@/features/trading/store/use-trade-modal-store";
import { cn } from "@/lib/utils";

function resolveTradeMarketId(market: Market): string | null {
  if (market.backendMarketId) return market.backendMarketId;
  if (isUuid(market.id)) return market.id;
  return null;
}

function MarketDetailsBody({ slug }: { slug: string }) {
  const actorId = useAuthStore((s) => s.tradingUserId ?? undefined);
  const searchParams = useSearchParams();
  const { data: markets = [], isLoading: feedLoading } = useMarketsFeedQuery();

  const market = useMemo(
    () => markets.find((m) => m.slug === slug || m.id === slug),
    [markets, slug],
  );

  const tradeMarketId = market ? resolveTradeMarketId(market) : null;

  useMarketRoom(tradeMarketId ?? undefined);
  const rt = useMarketRealtime(tradeMarketId ?? undefined);
  useMarketOddsRealtimeInvalidation(tradeMarketId ?? undefined, rt.seq, 140);
  useTradingQueriesSync(actorId);

  const oddsQuery = useMarketOddsQuery(tradeMarketId ?? undefined);
  const odds = oddsQuery.data;

  const midYes = useMemo(
    () => mergeMidYes(market?.probability ?? 0.5, odds, rt),
    [market, odds, rt],
  );

  const { yesLabel, noLabel } = useMemo(
    () => mergeYesNoDisplay(market?.probability ?? 0.5, odds, rt),
    [market, odds, rt],
  );

  // Honor `?side=YES|NO` from MarketCard quick-trade buttons.
  const sideParam = (searchParams?.get("side") ?? "").toUpperCase();
  const initialOutcome: "YES" | "NO" = sideParam === "NO" ? "NO" : "YES";

  const tradeDisabled =
    market && market.status !== "OPEN"
      ? `Market is ${market.status.toLowerCase()} — trading disabled.`
      : null;

  const tradeModalMarket: TradeModalMarket | null = useMemo(() => {
    if (!market) return null;
    return {
      tradeMarketId,
      slug: market.slug,
      title: market.title,
      category: market.category,
      midYes,
      status: market.status,
      closesAt: market.closesAt,
    };
  }, [market, midYes, tradeMarketId]);

  if (feedLoading && !market) {
    return <MarketDetailsSkeleton />;
  }

  if (!market) {
    notFound();
  }

  return (
    <main className="py-r8 text-zinc-100 lg:py-s40">
      <div className="mx-auto max-w-[min(1600px,100%)]">
        <MarketDetailsHeader
          market={market}
          yesLabel={yesLabel}
          noLabel={noLabel}
          midYes={midYes}
          tradeMarketId={tradeMarketId}
        />

        <div className="mt-r16 flex flex-col gap-r16 lg:mt-r24 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(320px,400px)] lg:items-start lg:gap-r24">
          <div className="min-w-0 space-y-r16 lg:space-y-r24 lg:pb-0 pb-[var(--mobile-trade-desk-clearance)]">
            <MarketChartPanel
              slug={market.slug}
              volumeUsd={market.volumeUsd}
              midYes={midYes}
              odds={odds}
              rt={rt}
              chartHeight={384}
            />

            <MarketRealtimeStrip
              yesLabel={yesLabel}
              noLabel={noLabel}
              midYes={midYes}
              seq={rt.seq}
              odds={odds}
              rt={rt}
            />

            <div className="grid gap-r16 lg:grid-cols-[minmax(0,1.15fr)_minmax(260px,0.85fr)]">
              <MarketVolumeChart
                slug={market.slug}
                rt={rt}
                className="rounded-lg border border-white/[0.06] bg-[#07070d]/95 shadow-none ring-1 ring-white/[0.05] [box-shadow:none]"
              />
              <MarketOrderBook
                slug={market.slug}
                midYes={midYes}
                liquidityUsd={market.liquidityUsd}
              />
            </div>

            <div className="grid gap-r16 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)]">
              <MarketActivityFeed tradeMarketId={tradeMarketId} rt={rt} />
              <div className="space-y-r12">
                <MarketNewsPanel market={market} />
                <MarketComments slug={market.slug} />
              </div>
            </div>

            <section className="mt-s40 space-y-r16 border-t border-white/[0.06] pt-r24 lg:mt-s48 lg:pt-s40">
              <MarketRelated
                currentSlug={market.slug}
                category={market.category}
                markets={markets}
              />
              <MarketActivityFeed
                tradeMarketId={tradeMarketId}
                rt={rt}
                density="compact"
                filter="whales"
                maxRows={14}
                heading={{ title: "Large prints", subtitle: "Whale-sized fills" }}
              />
            </section>
          </div>

          <aside
            className={cn(
              "min-w-0 lg:self-start lg:relative lg:block",
              "max-lg:fixed max-lg:left-0 max-lg:right-0 max-lg:z-[38]",
              "max-lg:bottom-[var(--app-mobile-dock-h)] max-lg:border-t max-lg:border-white/[0.08]",
              "max-lg:bg-[#07070d]/96 max-lg:backdrop-blur-xl max-lg:shadow-[0_-12px_44px_rgba(0,0,0,0.58)]",
              "max-lg:max-h-[min(44vh,336px)] max-lg:overflow-y-auto max-lg:overscroll-contain max-lg:scrollbar-terminal",
            )}
          >
            <div className="max-lg:p-2 lg:sticky lg:top-[calc(var(--app-topbar-h)+8px)] lg:p-0">
              <MarketTradingDesk
                marketId={tradeMarketId}
                userId={actorId}
                yesDisplay={yesLabel}
                noDisplay={noLabel}
                disabledHint={tradeDisabled}
                tradeModalMarket={tradeModalMarket}
                initialOutcome={initialOutcome}
                market={market}
                odds={odds}
                rt={rt}
                midYes={midYes}
              />
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

export function MarketDetailsPage({ slug }: { slug: string }) {
  /* SocketProvider is mounted once globally by `AppShell`. */
  return <MarketDetailsBody slug={slug} />;
}
