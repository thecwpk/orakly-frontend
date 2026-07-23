"use client";

import { CommunityDiscovery } from "./sections/community-discovery";
import { Hero } from "./sections/Hero";
import { LiveMarkets } from "./sections/live-markets";
import { MarketActivity } from "./sections/market-activity";
import { MarketPulse } from "./sections/market-pulse";
import { TrendingNarratives } from "./sections/trending-narratives";
import { TrustEcosystemStrip } from "./sections/trust-ecosystem-strip";
import "./hub-design-tokens.css";

/** DApp hub — Hero → Pulse → Narratives → Markets → Activity → Discovery → Trust. */
export function DappHubPage() {
  return (
    <div className="hub-app-canvas hub-root">
      <div className="hub-container">
        <Hero />
        <div className="hub-sections-stack pb-10">
          <MarketPulse />
          <TrendingNarratives />
          <LiveMarkets />
          <MarketActivity />
          <CommunityDiscovery />
          <TrustEcosystemStrip />
        </div>
      </div>
    </div>
  );
}
