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

/** Server-side bundle for /dapp — avoids empty client shell when API cache was stale. */
export async function loadHubHomeBundle(): Promise<HubHomeBundle> {
  const [stats, attention, narrativeWars, conviction, trending, categories, suggestions] =
    await Promise.all([
      getHomeStats(),
      getAttentionDashboardRows(),
      getNarrativeWars(),
      getConvictionMarkets(6),
      getHubTrendingMarkets(20),
      getCategoriesOverview(),
      getPublicMarketSuggestions(5),
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
