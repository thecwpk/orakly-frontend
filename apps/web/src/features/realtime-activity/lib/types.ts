import type { Market } from "@orakly/types";

/** Discriminated union for every kind of row the feed renders. */
export type ActivityRow =
  | TradeActivityRow
  | UpdateActivityRow
  | NotificationActivityRow;

export type TradeActivityRow = {
  kind: "trade";
  /** Stable id used as React key. */
  id: string;
  /** Epoch ms — used for sorting and time-ago label. */
  at: number;
  side: "BUY" | "SELL";
  outcome: "YES" | "NO";
  price: number;
  quantity: number;
  notionalUsd: number;
  /** Resolved market metadata when available. `null` when the feed row points
   *  at a market we haven't loaded yet (still rendered with a fallback). */
  market: ActivityMarketRef | null;
};

export type UpdateActivityRow = {
  kind: "update";
  id: string;
  at: number;
  /** Backend-supplied `activityType`, e.g. `MARKET_RESOLVED`, `MARKET_CLOSED`. */
  variant: string;
  title: string;
  description?: string;
  market: ActivityMarketRef | null;
};

export type NotificationActivityRow = {
  kind: "notification";
  id: string;
  at: number;
  variant: "FILL" | "SETTLE" | "ALERT" | "MENTION" | "SYSTEM";
  title: string;
  description: string;
  href?: string;
  read: boolean;
};

export type ActivityMarketRef = {
  /** Display id (slug-safe). */
  id: string;
  slug: string;
  title: string;
  category: string;
};

/** UI filter selectors. */
export type ActivityFilter = "all" | "trades" | "updates" | "yours";

export const ACTIVITY_FILTERS: ReadonlyArray<{
  id: ActivityFilter;
  label: string;
}> = [
  { id: "all", label: "All" },
  { id: "trades", label: "Trades" },
  { id: "updates", label: "Updates" },
  { id: "yours", label: "Yours" },
];

/** Lightweight index for `O(1)` market lookup by id _and_ by backend uuid. */
export type MarketsIndex = {
  byId: Map<string, Market>;
  byBackendId: Map<string, Market>;
};

export function buildMarketsIndex(markets: readonly Market[] | undefined): MarketsIndex {
  const byId = new Map<string, Market>();
  const byBackendId = new Map<string, Market>();
  if (!markets) return { byId, byBackendId };
  for (const m of markets) {
    byId.set(m.id, m);
    if (m.backendMarketId) byBackendId.set(m.backendMarketId, m);
  }
  return { byId, byBackendId };
}

export function lookupMarket(
  index: MarketsIndex,
  marketId: string | null | undefined,
): Market | null {
  if (!marketId) return null;
  return index.byId.get(marketId) ?? index.byBackendId.get(marketId) ?? null;
}

export function toActivityMarketRef(m: Market | null): ActivityMarketRef | null {
  if (!m) return null;
  return { id: m.id, slug: m.slug, title: m.title, category: m.category };
}
