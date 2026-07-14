import type { Market } from "@orakly/types";

/** Full market detail payload for `/markets/[slug]`. */
export type MarketDetailDto = Market & {
  backendMarketId: string;
  creatorAddress: string | null;
  resolutionSource: string | null;
  creatorRewardPercent: number;
  narrative: string | null;
  attentionScore: number | null;
  convictionScore: number | null;
  momentum: string;
  participants: number;
  createdAt: string;
  rawStatus: string;
};

export type MarketOddsPeriod = "1H" | "24H" | "7D" | "All";

export type MarketOddsChartPoint = {
  time: string;
  yes: number;
  no: number;
  volume: number;
};

export type MarketTradeDetailDto = {
  id: string;
  marketId: string;
  time: string;
  walletAddress: string | null;
  side: "YES" | "NO";
  direction: "BUY" | "SELL";
  amount: number;
  shares: number;
  price: number;
  txHash: string | null;
};

export type MarketCommentDto = {
  id: string;
  marketId: string;
  body: string;
  walletAddress: string | null;
  createdAt: string;
};
