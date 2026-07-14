import type { Market } from "@orakly/types";

/** Markets explorer table row — enriched market + participants. */
export type MarketsExplorerRowDto = Market & {
  creatorAddress: string | null;
  narrative: string | null;
  momentum?: string;
  attentionScore?: number | null;
  convictionScore?: number | null;
  participants: number;
};

export type MarketsExplorerSort =
  | "trending"
  | "volume"
  | "newest"
  | "ending"
  | "discussed";

export type MarketsExplorerParams = {
  q?: string;
  category?: string;
  status?: string;
  narrative?: string;
  creator?: string;
  dateFrom?: string;
  dateTo?: string;
  minVolume?: number;
  maxVolume?: number;
  minProbability?: number;
  maxProbability?: number;
  /** OPEN markets created by community wallets (creatorAddress set). */
  communityOnly?: boolean;
  sort?: MarketsExplorerSort | string;
  page?: number;
  limit?: number;
};

export type MarketsExplorerResult = {
  markets: MarketsExplorerRowDto[];
  total: number;
  page: number;
  totalPages: number;
};
