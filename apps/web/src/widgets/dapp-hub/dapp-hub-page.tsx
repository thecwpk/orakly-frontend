"use client";

import { HubAttentionDashboard } from "./components/hub-attention-dashboard";
import { HubCategoriesGrid } from "./components/hub-categories-grid";
import { HubCommunityIntelligence } from "./components/hub-community-intelligence";
import { HubHeroAttentionTerminal } from "./components/hub-hero-attention-terminal";
import { HubHighVolumeSection } from "./components/hub-high-volume-section";
import { HubNarrativeWarsSection } from "./components/hub-narrative-wars-section";
import { HubPortfolioShortcut } from "./components/hub-portfolio-shortcut";
import { HubTrendingMarketsTable } from "./components/hub-trending-markets-table";
import "./hub-design-tokens.css";

/** Hub home — markets-first layout with a cool blue trading canvas. */
export function DappHubPage() {
  return (
    <div className="hub-root -mx-[var(--app-page-gutter-x)] w-[calc(100%+2*var(--app-page-gutter-x))] max-w-none">
      <div className="hub-container hub-sections-stack pb-20 sm:pb-24">
        <HubHeroAttentionTerminal />
        <HubTrendingMarketsTable />
        <HubCategoriesGrid />
        <HubHighVolumeSection />
        <HubCommunityIntelligence />
        <div className="hub-insights-band hub-section hub-section--mobile-reorder-insights hub-section--compact !pt-0">
          <HubNarrativeWarsSection className="!pt-0" />
          <HubAttentionDashboard className="!pt-0" />
        </div>
        <HubPortfolioShortcut />
      </div>
    </div>
  );
}
