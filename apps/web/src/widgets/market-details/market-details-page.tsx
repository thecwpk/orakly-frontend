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
import { MarketActivitySection } from "./components/market-activity-section";
import { MarketChartPanel } from "./components/market-chart-panel";
import { MarketComments } from "./components/market-comments";
import { MarketDetailsHeader } from "./components/market-details-header";
import { MarketDetailsSkeleton } from "./components/market-details-skeleton";
import { MarketDetailSection } from "./components/market-detail-section";
import { MarketNewsPanel } from "./components/market-news-panel";
import { MarketNotFound } from "./components/market-not-found";
import { MarketOrderBook } from "./components/market-order-book";
import { MarketOverviewPanel } from "./components/market-overview-panel";
import { MarketRelated } from "./components/market-related";
import { MarketTradingDesk } from "./components/market-trading-desk";
import { MarketVolumeChart } from "./components/market-volume-chart";
import { isUuid } from "./lib/is-uuid";
import { mergeMidYes, mergeYesNoDisplay } from "./lib/merge-odds";
import type { TradeModalMarket } from "@/features/trading/store/use-trade-modal-store";
import type { MarketOddsDto } from "@/shared/api/fetchers/markets-live";
import type { MarketRealtimeSnapshot } from "@/websocket/store/market-realtime-store";

function resolveTradeMarketId(market: Market): string | null {
  if (market.backendMarketId) return market.backendMarketId;
  if (isUuid(market.id)) return market.id;
  return null;
}

function TradeDeskBlock({
  deskKey,
  marketId,
  userId,
  yesDisplay,
  noDisplay,
  disabledHint,
  tradeModalMarket,
  initialOutcome,
  odds,
  rt,
  midYes,
}: {
  deskKey: string;
  marketId: string | null;
  userId: string | undefined;
  yesDisplay: string;
  noDisplay: string;
  disabledHint: string | null;
  tradeModalMarket: TradeModalMarket | null;
  initialOutcome: "YES" | "NO";
  odds: MarketOddsDto | undefined;
  rt: MarketRealtimeSnapshot;
  midYes: number;
}) {
  return (
    <MarketTradingDesk
      key={deskKey}
      marketId={marketId}
      userId={userId}
      yesDisplay={yesDisplay}
      noDisplay={noDisplay}
      disabledHint={disabledHint}
      tradeModalMarket={tradeModalMarket}
      initialOutcome={initialOutcome}
      market={market}
      odds={odds}
      rt={rt}
      midYes={midYes}
      compact
    />
  );
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

  const { yesLabel, noLabel, no: noMid } = useMemo(
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

  const deskProps = {
    marketId: tradeMarketId,
    userId: actorId,
    yesDisplay: yesLabel,
    noDisplay: noLabel,
    disabledHint: tradeDisabled,
    tradeModalMarket,
    initialOutcome,
    odds,
    rt,
    midYes,
  };

  return (
    <main className="pb-[calc(var(--app-mobile-dock-h)+0.5rem)] pt-3 text-zinc-100 lg:pb-5 lg:pt-4">
      <div className="mx-auto w-full max-w-[min(1440px,100%)] px-3 sm:px-4 lg:px-5">
        <MarketDetailsHeader market={market} tradeMarketId={tradeMarketId} />

        <div className="mt-3 grid items-start gap-3 lg:mt-4 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex min-w-0 flex-col gap-3">
            <MarketOverviewPanel
              market={market}
              midYes={midYes}
              midNo={noMid}
              yesLabel={yesLabel}
              noLabel={noLabel}
              odds={odds}
              rt={rt}
            />

            <div id="market-trade-panel" className="lg:hidden">
              <MarketDetailSection title="Trade" hint="Quote preview · confirm in modal">
                <TradeDeskBlock deskKey="desk-mobile-inline" {...deskProps} />
              </MarketDetailSection>
            </div>

            <MarketDetailSection
              title="Price"
              hint="YES implied probability"
              bodyClassName="min-w-0"
            >
              <MarketChartPanel
                slug={market.slug}
                volumeUsd={market.volumeUsd}
                midYes={midYes}
                odds={odds}
                rt={rt}
                chartHeight={200}
              />
            </MarketDetailSection>

            <MarketDetailSection title="Depth" hint="24h volume · order book preview">
              <div className="grid min-w-0 gap-3 md:grid-cols-2">
                <MarketVolumeChart slug={market.slug} rt={rt} className="min-w-0" />
                <MarketOrderBook
                  slug={market.slug}
                  midYes={midYes}
                  liquidityUsd={market.liquidityUsd}
                />
              </div>
            </MarketDetailSection>

            <MarketActivitySection tradeMarketId={tradeMarketId} rt={rt} />

            <MarketDetailSection title="Context">
              <div className="grid gap-3 md:grid-cols-2">
                <MarketNewsPanel market={market} />
                <MarketComments slug={market.slug} />
              </div>
            </MarketDetailSection>

            {hasRelatedMarkets ? (
              <MarketDetailSection title="Related markets">
                <MarketRelated
                  currentSlug={market.slug}
                  category={market.category}
                  markets={markets}
                />
              </MarketDetailSection>
            ) : null}
          </div>

          <aside className="hidden min-w-0 lg:block">
            <div className="sticky top-[calc(var(--app-topbar-h)+6px)]">
              <MarketDetailSection title="Trade" hint="Sticky while you scroll">
                <TradeDeskBlock deskKey="desk-desktop" {...deskProps} />
              </MarketDetailSection>
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
