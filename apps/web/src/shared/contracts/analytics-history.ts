export type AnalyticsAttentionPoint = {
  date: string;
  narrativeSlug: string;
  narrativeName: string;
  attentionScore: number;
  convictionScore: number;
  volume24hUsd: number;
};

export type AnalyticsResolvedMarket = {
  id: string;
  question: string;
  narrative: string | null;
  creatorAddress: string | null;
  outcome: string | null;
  totalVolume: number;
  uniqueTraders: number;
  resolvedAt: string | null;
};

export type AnalyticsHistoryPayload = {
  period: { from: string; to: string };
  attentionTimeSeries: AnalyticsAttentionPoint[];
  resolvedMarkets: AnalyticsResolvedMarket[];
  summary: {
    totalVolume: number;
    totalMarkets: number;
    resolvedMarkets: number;
    avgAttentionScore: number;
  };
};

export type AnalyticsHistoryFilters = {
  from: string;
  to: string;
  narrative: "all" | string;
  category: "all" | string;
};
