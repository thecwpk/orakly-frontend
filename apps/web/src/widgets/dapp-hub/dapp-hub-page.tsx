"use client";

import { CommunityDiscovery } from "./sections/community-discovery";
import { LiveMarkets } from "./sections/live-markets";
import { MarketActivity } from "./sections/market-activity";
import { MarketPulse } from "./sections/market-pulse";
import { TrendingNarratives } from "./sections/trending-narratives";
import "./hub-design-tokens.css";

/** DApp hub — Pulse → Narratives → Markets → Activity → Discovery. */
export function DappHubPage() {
  return (
    <div className="hub-root mx-auto max-w-7xl space-y-0 px-4 py-6">
      <MarketPulse />
      <hr className="my-8 border-[var(--hub-border)]" />
      <TrendingNarratives />
      <hr className="my-8 border-[var(--hub-border)]" />
      <LiveMarkets />
      <hr className="my-8 border-[var(--hub-border)]" />
      <MarketActivity />
      <hr className="my-8 border-[var(--hub-border)]" />
      <CommunityDiscovery />
    </div>
  );
}
