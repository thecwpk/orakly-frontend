export type ProfilePositionRow = {
  marketId: string;
  marketSlug: string;
  marketTitle: string;
  side: "YES" | "NO";
  amountUsd: number;
  oddsPct: number;
  estPayoutUsd: number;
};

export type ProfileTradeStatus = "open" | "won" | "lost";

export type ProfileTradeRow = {
  id: string;
  at: string;
  marketSlug: string;
  marketTitle: string;
  marketCategory: string;
  side: "YES" | "NO";
  amountUsd: number;
  status: ProfileTradeStatus;
  /** On-chain tx hash when available. */
  txHash: string | null;
};

export type TraderProfilePayload = {
  address: string;
  displayName: string | null;
  joinedAt: string | null;
  userId: string | null;
  rank: number;
  stats: {
    winRatePct: number;
    totalPnlUsd: number;
    totalVolumeUsd: number;
    openPositions: number;
  };
  positions: ProfilePositionRow[];
  trades: ProfileTradeRow[];
  tradesNextCursor: string | null;
};

export type ProfileTradesPage = {
  trades: ProfileTradeRow[];
  nextCursor: string | null;
};

export type ProfilePnlWindow = "7d" | "30d" | "all";

export type PnlPoint = {
  at: string;
  pnl: number;
};
