"use client";

import { useSearchParams } from "next/navigation";
import { useOpenTradeModal } from "@/features/trading";
import { useHubTrendingMarketsQuery } from "@/shared/api/hooks";
import { groupHubFeedMarkets } from "../lib/hub-feed-grouping";
import { marketToTradeModal } from "../lib/open-hub-trade";
import { HubFeedCardBinary, HubFeedCardMulti } from "./hub-feed-cards";
import { HubFeedSectionHeader } from "./hub-feed-section-header";
import { HubSectionRetry } from "./hub-section-retry";

/** Polymarket-style card grid — binary Up/Down + multi-outcome groups. */
export function HubMarketFeedGrid() {
  const searchParams = useSearchParams();
  const filter = {
    cat: searchParams?.get("cat"),
    narrative: searchParams?.get("narrative"),
    breaking: searchParams?.get("breaking") === "1",
  };
  const trendingQ = useHubTrendingMarketsQuery(60, filter);
  const openTrade = useOpenTradeModal();
  const markets = trendingQ.data ?? [];
  const feedItems = groupHubFeedMarkets(markets);

  return (
    <section className="hub-feed-section" aria-label="Markets">
      <HubFeedSectionHeader marketCount={markets.length} />
      {trendingQ.isError ? (
        <HubSectionRetry onRetry={() => void trendingQ.refetch()} />
      ) : trendingQ.isLoading ? (
        <div className="hub-feed-grid">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="hub-skeleton hub-feed-card-skeleton" />
          ))}
        </div>
      ) : feedItems.length === 0 ? (
        <p className="py-12 text-center text-sm text-[var(--hub-muted)]">No markets match this filter.</p>
      ) : (
        <div className="hub-feed-grid">
          {feedItems.map((item) =>
            item.kind === "multi" ? (
              <HubFeedCardMulti
                key={item.id}
                eventTitle={item.eventTitle}
                category={item.category}
                markets={item.markets}
                totalVolumeUsd={item.totalVolumeUsd}
                onTrade={(m) => openTrade(marketToTradeModal(m))}
              />
            ) : (
              <HubFeedCardBinary
                key={item.market.id}
                market={item.market}
                onTrade={(side) => openTrade(marketToTradeModal(item.market), side)}
              />
            ),
          )}
        </div>
      )}
    </section>
  );
}
