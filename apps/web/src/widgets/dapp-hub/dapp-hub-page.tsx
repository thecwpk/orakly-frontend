"use client";

import { HubFeedChrome } from "./components/hub-feed-chrome";
import { HubFeedHero } from "./components/hub-feed-hero";
import { HubMarketFeedGrid } from "./components/hub-market-feed-grid";
import "./hub-design-tokens.css";

/** Trading hub — hero spotlight + Polymarket-style market feed. */
export function DappHubPage() {
  return (
    <div className="hub-root w-full min-w-0">
      <HubFeedChrome />
      <HubFeedHero />
      <div className="hub-container hub-feed-body pb-20 sm:pb-24">
        <HubMarketFeedGrid />
      </div>
    </div>
  );
}
