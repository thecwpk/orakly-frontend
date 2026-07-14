import type { Market } from "@orakly/types";

export type LiveMarketsSort = "trending" | "volume" | "newest" | "ending";

/** Live Markets hub cards — enriched markets feed row + participant count. */
export type LiveMarketCardDto = Market & {
  creatorAddress: string | null;
  narrative: string | null;
  momentum?: string;
  attentionScore?: number | null;
  convictionScore?: number | null;
  participants: number;
};
