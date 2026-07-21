"use client";

import { useMarketBySlugQuery } from "@/shared/api/hooks";
import { MarketDiscussion } from "./sections/market-discussion";
import { MarketOverviewSection, MarketShareSection } from "./sections/market-overview";
import { MarketPriceChart } from "./sections/market-price-chart";
import { MarketRecentTrades } from "./sections/market-recent-trades";
import { MarketTradingPanel } from "./sections/market-trading-panel";
import { MarketDetailsSkeleton } from "./components/market-details-skeleton";
import { MarketNotFound } from "./components/market-not-found";
import "./market-detail-tokens.css";

export function MarketDetailsPage({ slug }: { slug: string }) {
  const marketQ = useMarketBySlugQuery(slug);
  const market = marketQ.data;
  const marketId = market?.backendMarketId ?? market?.id;

  if (marketQ.isLoading && !market) {
    return <MarketDetailsSkeleton />;
  }

  if (marketQ.isError || !market || !marketId) {
    return <MarketNotFound slug={slug} />;
  }

  return (
    <div className="market-detail-root hub-root">
      <div className="market-detail-container mx-auto w-full max-w-6xl space-y-8 px-4 py-6 pb-20 sm:px-6">
        <MarketOverviewSection market={market} />
        <MarketTradingPanel market={market} />
        <MarketPriceChart marketId={marketId} />
        <MarketRecentTrades marketId={marketId} />
        <MarketDiscussion marketId={marketId} />
        <MarketShareSection question={market.title} marketId={marketId} />
      </div>
    </div>
  );
}
