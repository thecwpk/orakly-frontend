export type LeaderboardWindow = "24h" | "7d" | "30d" | "all";

export type LeaderboardSortKey = "pnl" | "roi" | "volume" | "winRate";

export type LeaderboardMetricTab = "traders" | "winRate" | "pnl" | "creators";

export type Trader = {
  /** Stable identifier (wallet address). */
  address: string;
  /** Display alias / handle. */
  alias: string;
  /** Realized + unrealized PnL in USD for the window. */
  pnlUsd: number;
  /** Total notional traded in the window. */
  volumeUsd: number;
  /** Win rate as a 0–100 percentage. */
  winRatePct: number;
  /** ROI = pnl / capitalDeployed (as 0–100 percentage). */
  roiPct: number;
  /** Number of trades in the window. */
  trades: number;
  tradeCount: number;
  bestTradeUsd: number;
  marketsTraded: number;
  /** 24h delta (in % of equity) — small + signed. */
  delta24h: number;
  /** Current win streak in trades, e.g. `7`. */
  streak: number;
  /** Sparkline of equity / pnl over the window (length ≤ 16). */
  spark: ReadonlyArray<number>;
};

export type RankedTrader = Trader & {
  /** 1-indexed rank within the current sort. */
  rank: number;
  /** Movement vs. the previous render (positive = climbed up the board). */
  rankDelta: number;
};
