"use client";

import type { Market } from "@orakly/types";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import {
  useMarketBySlugQuery,
  useMarketOddsQuery,
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
import { MarketNotFound } from "./components/market-not-found";
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

/** Hooks + layout only mount after slug resolves to a DB market (avoids render-loop from `notFound()`). */
function MarketDetailsLoaded({ market }: { market: Market }) {
  const actorId = useAuthStore((s) => s.tradingUserId ?? undefined);
  const searchParams = useSearchParams();
  const { data: markets = [] } = useMarketsFeedQuery();

  const tradeMarketId = resolveTradeMarketId(market);

  useMarketRoom(tradeMarketId ?? undefined);
  const rt = useMarketRealtime(tradeMarketId ?? undefined);
  useTradingQueriesSync(actorId);

  const oddsQuery = useMarketOddsQuery(tradeMarketId ?? undefined);
  const odds = oddsQuery.data;

  const feedProb = market.probability ?? 0.5;
  const httpYes = odds?.yesPrice;
  const httpNo = odds?.noPrice;
  const rtYes = rt.odds?.yesPrice;
  const rtNo = rt.odds?.noPrice;

  const midYes = useMemo(
    () => mergeMidYes(feedProb, odds, rt),
    [feedProb, httpYes, httpNo, rtYes, rtNo, rt.seq],
  );

  const { yesLabel, noLabel } = useMemo(
    () => mergeYesNoDisplay(feedProb, odds, rt),
    [feedProb, httpYes, httpNo, rtYes, rtNo, rt.seq],
  );

  const sideParam = (searchParams?.get("side") ?? "").toUpperCase();
  const initialOutcome: "YES" | "NO" = sideParam === "NO" ? "NO" : "YES";

  const tradeDisabled =
    market.status !== "OPEN"
      ? `Market is ${market.status.toLowerCase()} — trading disabled.`
      : null;

  const tradeModalMarket: TradeModalMarket | null = useMemo(
    () => ({
      tradeMarketId,
      slug: market.slug,
      title: market.title,
      category: market.category,
      midYes,
      status: market.status,
      closesAt: market.closesAt,
    }),
    [market, midYes, tradeMarketId],
  );

  const hasRelatedMarkets = useMemo(() => {
    if (!markets?.length) return false;
    return markets.some(
      (m) => m.slug !== market.slug && m.category === market.category,
    );
  }, [markets, market.slug, market.category]);

  return (
    <main className="py-r8 text-zinc-100 lg:py-s40">
      <div className="mx-auto w-full max-w-[min(1580px,100%)] px-4 sm:px-5 lg:px-6">
        <MarketDetailsHeader
          market={market}
          yesLabel={yesLabel}
          noLabel={noLabel}
          midYes={midYes}
          tradeMarketId={tradeMarketId}
        />

        <div className="relative mt-r16 flex flex-col gap-r16 lg:mt-r24 lg:gap-y-8">
          <div className="min-w-0 w-full max-w-none space-y-r16 pb-[var(--mobile-trade-desk-clearance)] lg:space-y-r8 lg:pb-0">
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

            {/*
              Desktop: volume | order book | trade desk in one row (balanced, no tall empty rail).
              Mobile: fixed bottom dock (second desk instance) — resize may reset local form state.
            */}
            <div className="grid min-w-0 gap-4 max-lg:grid-cols-1 lg:grid-cols-3 lg:items-start lg:gap-5">
              <MarketVolumeChart
                slug={market.slug}
                rt={rt}
                className="min-w-0 rounded-lg border border-white/[0.08] bg-[hsl(228_28%_10%/0.96)] shadow-none ring-1 ring-white/[0.06] [box-shadow:none]"
              />
              <div className="min-w-0">
                <MarketOrderBook
                  slug={market.slug}
                  midYes={midYes}
                  liquidityUsd={market.liquidityUsd}
                />
              </div>
              <div className="hidden min-h-0 min-w-0 lg:block lg:self-start">
                <div className="lg:sticky lg:top-[calc(var(--app-topbar-h)+8px)] lg:w-full">
                  <MarketTradingDesk
                    key="desk-desktop"
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
              </div>
            </div>

            {/*
              Equal halves: activity (left) vs wire + notes (right); height follows content.
            */}
            <div className="grid min-h-0 min-w-0 gap-5 lg:grid-cols-2 lg:items-start lg:gap-6">
              <div className="min-h-0 min-w-0">
                <MarketActivityFeed
                  tradeMarketId={tradeMarketId}
                  rt={rt}
                  className="w-full"
                />
              </div>
              <div className="flex min-h-0 min-w-0 flex-col gap-5">
                <MarketNewsPanel market={market} />
                <MarketComments slug={market.slug} />
              </div>
            </div>

            <section
              className={cn(
                "mt-s40 grid min-w-0 gap-5 border-t border-white/[0.08] pt-r24 lg:mt-s48 lg:pt-s40",
                hasRelatedMarkets ? "lg:grid-cols-2 lg:gap-6 lg:items-start" : "lg:grid-cols-1",
              )}
            >
              {hasRelatedMarkets ? (
                <>
                  <div className="min-w-0">
                    <MarketRelated
                      currentSlug={market.slug}
                      category={market.category}
                      markets={markets}
                    />
                  </div>
                  <div className="flex min-h-0 min-w-0">
                    <MarketActivityFeed
                      tradeMarketId={tradeMarketId}
                      rt={rt}
                      density="compact"
                      filter="whales"
                      maxRows={14}
                      heading={{ title: "Large prints", subtitle: "Whale-sized fills" }}
                      className="w-full"
                    />
                  </div>
                </>
              ) : (
                <div className="min-w-0">
                  <MarketActivityFeed
                    tradeMarketId={tradeMarketId}
                    rt={rt}
                    density="compact"
                    filter="whales"
                    maxRows={14}
                    heading={{ title: "Large prints", subtitle: "Whale-sized fills" }}
                    className="w-full"
                  />
                </div>
              )}
            </section>
          </div>

          <aside
            className={cn(
              "min-w-0 w-full lg:hidden",
              "fixed bottom-[var(--app-mobile-dock-h)] left-0 right-0 z-[38]",
              "border-t border-white/[0.08]",
              "bg-[hsl(228_26%_11%/0.96)] backdrop-blur-xl shadow-[0_-12px_44px_hsl(228_40%_4%/0.45)]",
              "max-h-[min(44vh,336px)] overflow-y-auto overscroll-contain scrollbar-terminal",
            )}
          >
            <div className="p-2">
              <MarketTradingDesk
                key="desk-mobile"
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

function MarketDetailsBody({ slug }: { slug: string }) {
  const marketQ = useMarketBySlugQuery(slug);

  if (marketQ.isLoading && !marketQ.data) {
    return <MarketDetailsSkeleton />;
  }

  if (marketQ.isError || !marketQ.data) {
    return <MarketNotFound slug={slug} />;
  }

  return <MarketDetailsLoaded key={marketQ.data.id} market={marketQ.data} />;
}

export function MarketDetailsPage({ slug }: { slug: string }) {
  return <MarketDetailsBody slug={slug} />;
}
