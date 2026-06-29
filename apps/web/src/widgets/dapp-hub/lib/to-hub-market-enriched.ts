import type { Market } from "@orakly/types";
import type { HubMarketEnriched } from "@/shared/contracts/hub-home";

/** Adapter for hub feed cards when the source is a plain markets feed row. */
export function toHubMarketEnriched(market: Market): HubMarketEnriched {
  const row = market as Partial<HubMarketEnriched>;
  return {
    ...market,
    volume24hUsd: row.volume24hUsd ?? market.volumeUsd ?? 0,
    conviction: row.conviction ?? 0,
    attentionScore: row.attentionScore ?? null,
    momentumPct: row.momentumPct ?? null,
    createdAt: row.createdAt ?? market.closesAt ?? new Date(0).toISOString(),
  };
}
