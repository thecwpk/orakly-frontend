import type { Market } from "@orakly/types";
import type { HubMarketEnriched } from "@/shared/contracts/hub-home";
import { mergeHubSpotlightMarkets } from "./merge-hub-spotlight-markets";

function asEnriched(m: Market): HubMarketEnriched {
  if ("volume24hUsd" in m && typeof (m as HubMarketEnriched).volume24hUsd === "number") {
    return m as HubMarketEnriched;
  }
  return {
    ...m,
    volume24hUsd: m.volumeUsd ?? 0,
    conviction: 0,
    attentionScore: null,
    momentumPct: null,
    createdAt: m.closesAt,
  };
}

/** Left rail: breaking → trending → hot, deduped. */
export function buildHeroTrendRail(
  trending: readonly HubMarketEnriched[],
  breaking: readonly Market[],
  hot: readonly Market[],
  take = 10,
): HubMarketEnriched[] {
  const seen = new Set<string>();
  const out: HubMarketEnriched[] = [];

  const add = (raw: Market | HubMarketEnriched) => {
    if (seen.has(raw.id)) return;
    seen.add(raw.id);
    out.push(asEnriched(raw));
  };

  for (const m of breaking.slice(0, 4)) add(m);
  for (const m of trending) add(m);
  for (const m of hot.slice(0, 4)) add(m);

  return out.slice(0, take);
}

export function buildHeroSpotlight(
  preview: {
    trendingList: readonly Market[];
    trendingTape: readonly Market[];
    trendingActivity: readonly Market[];
    trendingHot: readonly Market[];
    trendingNew: readonly Market[];
  } | null,
  fallback: readonly HubMarketEnriched[],
): Market[] {
  if (preview) {
    const merged = mergeHubSpotlightMarkets(
      preview.trendingList,
      preview.trendingTape,
      preview.trendingActivity,
      preview.trendingHot,
      preview.trendingNew,
    );
    if (merged.length > 0) return merged;
  }
  return fallback.slice(0, 5);
}

export function resolveHeroActiveMarket(
  rail: readonly HubMarketEnriched[],
  spotlight: readonly Market[],
  activeId: string | null,
): Market | HubMarketEnriched | null {
  if (activeId) {
    const fromRail = rail.find((m) => m.id === activeId);
    if (fromRail) return fromRail;
    const fromSpot = spotlight.find((m) => m.id === activeId);
    if (fromSpot) return fromSpot;
  }
  return spotlight[0] ?? rail[0] ?? null;
}
