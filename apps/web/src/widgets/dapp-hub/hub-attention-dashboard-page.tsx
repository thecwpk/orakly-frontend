"use client";

import { HubCommunityIntelligence } from "./components/hub-community-intelligence";
import { HubHighVolumeSection } from "./components/hub-high-volume-section";
import { HubNarrativeWarsSection } from "./components/hub-narrative-wars-section";
import { HubPortfolioShortcut } from "./components/hub-portfolio-shortcut";
import { HubTraderStrip } from "./components/hub-trader-strip";
import "./hub-design-tokens.css";

/** Attention analytics — moved off `/dapp` feed for Polymarket-style home. */
export function HubAttentionDashboardPage() {
  return (
    <div className="hub-root hub-root--analytics w-full min-w-0">
      <div className="hub-container hub-sections-stack pb-20 sm:pb-24">
        <header className="hub-section !pt-6">
          <h1 className="hub-section-title">Attention</h1>
          <p className="hub-section-sub">Narrative momentum, matchups, and community signals.</p>
        </header>
        <HubTraderStrip />
        <HubHighVolumeSection />
        <HubNarrativeWarsSection />
        <HubCommunityIntelligence />
        <HubPortfolioShortcut />
      </div>
    </div>
  );
}
