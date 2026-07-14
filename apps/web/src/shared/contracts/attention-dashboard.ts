export type AttentionMomentum = "Growing" | "Cooling" | "Stable";

export type AttentionDashboardItem = {
  id: string;
  narrativeSlug: string;
  narrativeName: string;
  attentionScore: number;
  convictionScore: number;
  momentum: AttentionMomentum;
  volume24hUsd: number;
  activeMarkets: number;
  uniqueTraders: number;
  liquidity: number;
  openInterest: number;
  /** Prior attention score (~24h) — used for momentum % delta. */
  scorePrev24h: number;
  lastUpdated: string;
  _isMock?: true;
};

export type AttentionDashboardPayload = {
  data: AttentionDashboardItem[];
  total: number;
  updatedAt: string;
};
