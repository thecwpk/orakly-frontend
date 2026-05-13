export type MarketOutcome = "YES" | "NO";

export type MarketStatus = "OPEN" | "RESOLVED" | "CLOSED";

export interface Market {
  id: string;
  slug: string;
  title: string;
  category: string;
  volumeUsd: number;
  liquidityUsd: number;
  probability: number;
  closesAt: string;
  status: MarketStatus;
  /** UUID for REST trading / odds when `id` is a display key */
  backendMarketId?: string;
}
