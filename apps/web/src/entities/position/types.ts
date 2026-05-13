import type { MarketOutcome } from "@orakly/types";

export type PositionId = string;

export type PositionEntity = {
  id: PositionId;
  marketId: string;
  outcome: MarketOutcome;
  shares: number;
  avgPrice: number;
};
