"use client";

import type { Market } from "@orakly/types";
import { useMemo } from "react";
import { useOpenTradeModal } from "@/features/trading";
import { HubFeedCardBinary, HubFeedCardMulti } from "@/widgets/dapp-hub/components/hub-feed-cards";
import { groupHubFeedMarkets } from "@/widgets/dapp-hub/lib/hub-feed-grouping";
import { marketToTradeModal } from "@/widgets/dapp-hub/lib/open-hub-trade";
import { toHubMarketEnriched } from "@/widgets/dapp-hub/lib/to-hub-market-enriched";

type Props = {
  markets: readonly Market[];
};

/** Hub-style Polymarket cards — same grid as `/dapp` home feed. */
export function MarketsExplorerGrid({ markets }: Props) {
  const openTrade = useOpenTradeModal();

  const items = useMemo(
    () => groupHubFeedMarkets(markets.map(toHubMarketEnriched)),
    [markets],
  );

  return (
    <div className="hub-feed-grid">
      {items.map((item) =>
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
  );
}

export function MarketsExplorerGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="hub-feed-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="hub-skeleton hub-feed-card-skeleton" />
      ))}
    </div>
  );
}
