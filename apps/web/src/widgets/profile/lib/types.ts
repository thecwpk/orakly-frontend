import type {
  ProfilePositionRow,
  ProfileTradeRow,
} from "@/shared/contracts/trader-profile";

export type ProfileWindow = "24h" | "7d" | "30d" | "90d" | "all";

export type EquityPoint = {
  /** ISO timestamp. */
  at: string;
  /** USD equity. */
  equity: number;
};
export type ProfileTrade = {
  id: string;
  marketSlug: string;
  marketTitle: string;
  marketCategory: string;
  side: "YES" | "NO";
  action: "BUY" | "SELL";
  /** Notional traded in USD. */
  sizeUsd: number;
  /** Realized PnL on this fill (negative for losing trades). */
  pnlUsd: number;
  /** ISO timestamp. */
  at: string;
};

export type PositionExposure = {
  marketSlug: string;
  marketTitle: string;
  category: string;
  /** Marked notional (USD) of the open position. */
  notionalUsd: number;
  /** Side of the position. */
  side: "YES" | "NO";
  /** Mark price as a 0..1 probability. */
  markProb: number;
};

export type CategoryMix = {
  category: string;
  /** USD allocated to this category. */
  notionalUsd: number;
  /** % of total exposure (0..100). */
  pct: number;
};

export type ProfileStats = {
  /** Total realized + unrealized PnL across the window. */
  pnlUsd: number;
  /** Cumulative volume traded. */
  volumeUsd: number;
  /** Win rate as 0..100. */
  winRatePct: number;
  /** Total number of closed trades. */
  trades: number;
  /** Net ROI vs deployed capital — 0..100. */
  roiPct: number;
  /** Best single-trade PnL. */
  bestTradeUsd: number;
  /** Average ticket. */
  avgTicketUsd: number;
  /** Current win streak (in trades). */
  streak: number;
  /** 24h delta on equity (signed %). */
  delta24h: number;
};

export type TraderProfile = {
  address: string;
  alias: string;
  joinedAt: string;
  rank: number;
  followers: number;
  following: number;
  /** Slugs of markets the trader is currently active in. */
  activeMarkets: number;
  stats: ProfileStats;
  equity: EquityPoint[];
  trades: ProfileTrade[];
  exposures: PositionExposure[];
  categoryMix: CategoryMix[];
  positions?: ProfilePositionRow[];
  publicTrades?: ProfileTradeRow[];
  tradesNextCursor?: string | null;
};
