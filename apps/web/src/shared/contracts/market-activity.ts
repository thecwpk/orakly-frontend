export type MarketActivityKind =
  | "TRADE"
  | "MARKET_APPROVED"
  | "MARKET_CREATED"
  | "MARKET_CLOSING"
  | "COMMUNITY_VOTE"
  | "UPCOMING_EVENT";

export type MarketActivityEvent = {
  id: string;
  kind: MarketActivityKind;
  at: string;
  /** Display question / title (already truncated when needed by UI). */
  question: string;
  marketSlug: string | null;
  /** TRADE */
  walletAddress?: string | null;
  outcome?: "YES" | "NO" | null;
  amountBnb?: number | null;
  /** MARKET_CREATED / MARKET_CLOSING */
  category?: string | null;
  hoursUntilClose?: number | null;
  volumeUsd?: number | null;
  /** COMMUNITY_VOTE */
  voteCount?: number | null;
  suggestionId?: string | null;
  /** UPCOMING_EVENT */
  eventName?: string | null;
  eventWhenLabel?: string | null;
};
