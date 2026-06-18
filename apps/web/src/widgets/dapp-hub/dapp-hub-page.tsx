"use client";

import { HubAttentionDashboard } from "./components/hub-attention-dashboard";
import { HubCategoriesGrid } from "./components/hub-categories-grid";
import { HubCommunityIntelligence } from "./components/hub-community-intelligence";
import { HubConvictionOpportunities } from "./components/hub-conviction-opportunities";
import { HubHeroAttentionTerminal } from "./components/hub-hero-attention-terminal";
import { HubHighVolumeSection } from "./components/hub-high-volume-section";
import { HubNarrativeWarsSection } from "./components/hub-narrative-wars-section";
import { HubNewOpportunities } from "./components/hub-new-opportunities";
import { HubPortfolioShortcut } from "./components/hub-portfolio-shortcut";
import { HubTrendingMarketsTable } from "./components/hub-trending-markets-table";
import "./hub-design-tokens.css";

/**
 * Attention-first hub home — narrative terminal, wars, conviction, trending.
 */
export function DappHubPage() {
  return (
    <div className="hub-root -mx-[var(--app-page-gutter-x)] w-[calc(100%+2*var(--app-page-gutter-x))] max-w-none">
      <div className="hub-container hub-sections-stack pb-24">
        <HubHeroAttentionTerminal />
        <HubNarrativeWarsSection />
        <HubAttentionDashboard />
        <HubTrendingMarketsTable />
        <HubHighVolumeSection />
        <HubConvictionOpportunities />
        <HubNewOpportunities />
        <HubCommunityIntelligence />
        <HubCategoriesGrid />
        <HubPortfolioShortcut />
      </div>
    </div>
  );
}
