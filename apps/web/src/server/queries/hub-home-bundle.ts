import type {
  AttentionNarrativeRow,
  CategoryOverviewRow,
  HomeStatsPayload,
  HubMarketEnriched,
  MarketSuggestionRow,
  NarrativeWarCard,
} from "@/shared/contracts/hub-home";
import { getAttentionDashboardRows } from "./attention-dashboard";
import { getCategoriesOverview } from "./categories-overview";
import { getConvictionMarkets } from "./conviction-markets";
import { getHomeStats } from "./home-stats";
import { getHubTrendingMarkets } from "./hub-trending-markets";
import { getPublicMarketSuggestions } from "./market-suggestions-public";
import { getNarrativeWars } from "./narrative-wars";

export type HubHomeBundle = {
  stats: HomeStatsPayload;
  attention: AttentionNarrativeRow[];
  narrativeWars: NarrativeWarCard[];
  conviction: HubMarketEnriched[];
  trending: HubMarketEnriched[];
  categories: CategoryOverviewRow[];
  suggestions: MarketSuggestionRow[];
};

export const EMPTY_HUB_HOME_BUNDLE: HubHomeBundle = {
  stats: {
    attentionIndex: 0,
    sentiment: "Bearish",
    currentMeta: "Crypto",
    topChain: "BNB",
    volume24hUsd: 0,
    openInterest: 0,
    liveMarkets: 0,
    activeTraders: 0,
    activeNarratives: 0,
    attentionUpdates24h: 0,
  },
  attention: [],
  narrativeWars: [],
  conviction: [],
  trending: [],
  categories: [],
  suggestions: [],
};

async function settle<T>(label: string, fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    console.error(`[hub-home-bundle] ${label} failed`, err);
    return fallback;
  }
}

/** Server-side bundle for /dapp — tolerates partial DB outages (e.g. Neon quota). */
export async function loadHubHomeBundle(): Promise<HubHomeBundle> {
  const [stats, attention, narrativeWars, conviction, trending, categories, suggestions] =
    await Promise.all([
      settle("stats", () => getHomeStats(), EMPTY_HUB_HOME_BUNDLE.stats),
      settle("attention", () => getAttentionDashboardRows(), []),
      settle("narrativeWars", () => getNarrativeWars(), []),
      settle("conviction", () => getConvictionMarkets(6), []),
      settle("trending", () => getHubTrendingMarkets(20), []),
      settle("categories", () => getCategoriesOverview(), []),
      settle("suggestions", () => getPublicMarketSuggestions(5), []),
    ]);

  return {
    stats,
    attention,
    narrativeWars,
    conviction,
    trending,
    categories,
    suggestions,
  };
}
