"use client";

import type { Market } from "@orakly/types";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { ROUTES } from "@/shared/constants/routes";
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
import { MarketDetailSection } from "./components/market-detail-section";
import { MarketDetailSplitRow } from "./components/market-detail-split-row";
import { MarketNewsPanel } from "./components/market-news-panel";
import { MarketNotFound } from "./components/market-not-found";
import { MarketOrderBook } from "./components/market-order-book";
import { MarketOverviewPanel } from "./components/market-overview-panel";
import { MarketResolutionPanel } from "./components/market-resolution-panel";
import { MarketRelated } from "./components/market-related";
import { MarketTradingDesk } from "./components/market-trading-desk";
import { MarketVolumeChart } from "./components/market-volume-chart";
import { isUuid } from "./lib/is-uuid";
import { mergeMidYes, mergeYesNoDisplay } from "./lib/merge-odds";
import "./market-detail-tokens.css";
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
  embedded = false,
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
  embedded?: boolean;
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
      odds={odds}
      rt={rt}
      midYes={midYes}
      embedded={embedded}
    />
  );
}

/** Hooks + layout only mount after slug resolves to a DB market (avoids render-loop from `notFound()`). */
function MarketDetailsLoaded({ market }: { market: Market }) {
  const router = useRouter();
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

  const handleSelectSide = useCallback(
    (side: "YES" | "NO") => {
      router.replace(`${ROUTES.market(market.slug)}?side=${side}`, { scroll: false });
      requestAnimationFrame(() => {
        document
          .getElementById("market-trade-panel")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    },
    [market.slug, router],
  );

  const tradeDisabled =
    market.status !== "OPEN"
      ? `Market is ${market.status.toLowerCase()} — trading disabled.`
      : null;

  const tradeModalMarket: TradeModalMarket | null = useMemo(
    () => ({
      tradeMarketId,
      onChainAddress: market.onChainAddress ?? null,
      chainId: market.chainId ?? null,
      slug: market.slug,
      title: market.title,
      category: market.category,
      midYes,
      status: market.status,
      closesAt: market.closesAt,
    }),
    [market, midYes, tradeMarketId, market.onChainAddress, market.chainId],
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
    <main className="market-detail-root pb-[calc(var(--app-mobile-dock-h)+0.5rem)] pt-3 lg:pb-6 lg:pt-4">
      <div className="market-detail-container mx-auto w-full max-w-[min(1280px,100%)] px-3 sm:px-4 lg:px-5">
        <MarketDetailsHeader market={market} tradeMarketId={tradeMarketId} />

        <div className="market-detail-hero-grid mt-3 lg:mt-4">
          <div className="market-detail-stack min-w-0">
            <MarketOverviewPanel
              market={market}
              midYes={midYes}
              midNo={noMid}
              yesLabel={yesLabel}
              noLabel={noLabel}
              odds={odds}
              rt={rt}
              selectedSide={initialOutcome}
              onSelectSide={handleSelectSide}
            />
            <MarketChartPanel
              slug={market.slug}
              marketId={tradeMarketId}
              volumeUsd={Math.max(
                market.volumeUsd,
                Number.parseFloat(odds?.volume24hUsd ?? "0") || 0,
              )}
              midYes={midYes}
              odds={odds}
              rt={rt}
              chartHeight={280}
            />
            <MarketResolutionPanel market={market} />
            {market.creatorDisplayName ? (
              <p className="text-center text-[11px] text-[var(--md-muted)]">
                Suggested by{" "}
                <span className="text-[var(--md-fg)]">{market.creatorDisplayName}</span>
              </p>
            ) : null}
          </div>

          <aside id="market-trade-panel" className="market-detail-trade-aside">
            <div className="market-detail-trade-shell market-detail-trade-sticky">
              <div className="market-detail-trade-head">
                <h2 className="market-detail-section-title">Trade</h2>
              </div>
              <TradeDeskBlock deskKey="desk-main" embedded {...deskProps} />
            </div>
          </aside>
        </div>

        <div className="mt-4 flex flex-col gap-4 lg:mt-5 lg:gap-5">
          <MarketDetailSplitRow
            left={
              <MarketVolumeChart slug={market.slug} rt={rt} className="h-full min-h-[280px]" />
            }
            right={
              tradeMarketId ? (
                <MarketOrderBook
                  marketId={tradeMarketId}
                  midYes={midYes}
                  className="h-full min-h-[280px]"
                />
              ) : (
                <div className="market-detail-panel flex h-full min-h-[280px] items-center justify-center text-[12px] text-[var(--md-muted)]">
                  Trades unavailable for this market
                </div>
              )
            }
          />

          {/* §3 — related markets full width */}
          {hasRelatedMarkets ? (
            <MarketDetailSection title="Related markets">
              <MarketRelated
                currentSlug={market.slug}
                category={market.category}
                markets={markets}
              />
            </MarketDetailSection>
          ) : null}

          {/* §4 — trades left · news wire right */}
          <MarketDetailSplitRow
            className="lg:min-h-[300px]"
            left={
              <MarketActivityFeed
                tradeMarketId={tradeMarketId}
                rt={rt}
                filter="trades-only"
                maxRows={28}
                fillColumn
                heading={{ title: "Activity" }}
                className="h-full min-h-[280px]"
              />
            }
            right={<MarketNewsPanel market={market} className="h-full min-h-[280px]" />}
          />

          {/* §5 — comments left · whale prints right */}
          <MarketDetailSplitRow
            className="lg:min-h-[260px]"
            left={<MarketComments slug={market.slug} className="h-full min-h-[240px]" />}
            right={
              <MarketActivityFeed
                tradeMarketId={tradeMarketId}
                rt={rt}
                filter="whales"
                maxRows={24}
                fillColumn
                heading={{ title: "Large prints" }}
                className="h-full min-h-[240px]"
              />
            }
          />
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
