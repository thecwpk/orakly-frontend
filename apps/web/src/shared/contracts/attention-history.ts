export type AttentionHistoryPeriod = "24h" | "7d" | "30d";

export type AttentionHistoryPoint = {
  date: string;
  attentionScore: number;
  convictionScore: number;
  volume24hUsd: number;
  momentum: string;
};

export type AttentionHistoryPayload = {
  narrative: string;
  period: AttentionHistoryPeriod;
  data: AttentionHistoryPoint[];
};
