import type { Market } from "@orakly/types";

export type EnrichedMarketDto = Market & {
  creatorAddress: string | null;
  resolutionSource: string | null;
  resolutionDate: string | null;
  narrative: string | null;
  attentionScore: number | null;
  convictionScore: number | null;
  momentum: string;
  creatorRewardPercent: number;
};
