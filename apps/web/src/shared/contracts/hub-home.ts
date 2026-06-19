import type { Market } from "@orakly/types";

export type AttentionTrend = "RISING" | "STABLE" | "COOLING";

export type AttentionNarrativeRow = {
  narrative: string;
  score: number;
  trend: AttentionTrend;
  momentumPct: number;
  previousScore: number | null;
};

export type HomeStatsPayload = {
  activeNarratives: number;
  liveMarkets: number;
  volume24hUsd: number;
  attentionUpdates24h: number;
};

export type NarrativeWarCard = {
  id: string;
  label: string;
  narrativeA: string;
  narrativeB: string;
  probAPct: number;
  probBPct: number;
  totalVolume24hUsd: number;
  conviction: number;
  momentumPct: number;
  marketSlug: string | null;
  marketTitle: string | null;
};

export type HubMarketEnriched = Market & {
  volume24hUsd: number;
  conviction: number;
  attentionScore: number | null;
  momentumPct: number | null;
  createdAt: string;
};

export type CategoryOverviewRow = {
  slug: string;
  name: string;
  marketCount: number;
  totalVolumeUsd: number;
  topNarrative: string | null;
};

export type HubTopicChipKind = "breaking" | "narrative";

export type HubTopicChip = {
  id: string;
  kind: HubTopicChipKind;
  label: string;
  slug?: string;
  score?: number;
  trend?: AttentionTrend;
  marketCount: number;
};

export type MarketSuggestionRow = {
  id: string;
  title: string;
  votesUp: number;
  votesDown: number;
  narrative: string | null;
  status: string;
  creator: string;
  creatorId?: string | null;
  createdAt: string;
};
