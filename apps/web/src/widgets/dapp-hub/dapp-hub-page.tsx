"use client";

import { HubCategoriesGrid } from "./components/hub-categories-grid";
import { HubCommunityIntelligence } from "./components/hub-community-intelligence";
import { HubHighVolumeSection } from "./components/hub-high-volume-section";
import { HubNarrativeWarsSection } from "./components/hub-narrative-wars-section";
import { HubPortfolioShortcut } from "./components/hub-portfolio-shortcut";
import { HubTraderStrip } from "./components/hub-trader-strip";
import { HubTrendingMarketsTable } from "./components/hub-trending-markets-table";
import "./hub-design-tokens.css";

/** Trader hub — markets first, visuals over copy. */
export function DappHubPage() {
  return (
    <div className="hub-root w-full min-w-0">
      <div className="hub-container hub-sections-stack pb-20 sm:pb-24">
        <HubTrendingMarketsTable />
        <HubTraderStrip />
        <HubHighVolumeSection />
        <HubNarrativeWarsSection />
        <HubCategoriesGrid />
        <HubCommunityIntelligence />
        <HubPortfolioShortcut />
      </div>
    </div>
  );
}
