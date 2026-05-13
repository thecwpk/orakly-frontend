import type { FeedActivityPayload } from "@orakly/realtime-protocol";
import type { Notification } from "@/features/notifications";
import { parseDecimal } from "./format";
import { isoToMs } from "./time";
import {
  buildMarketsIndex,
  lookupMarket,
  toActivityMarketRef,
  type ActivityRow,
  type MarketsIndex,
  type NotificationActivityRow,
  type TradeActivityRow,
  type UpdateActivityRow,
} from "./types";
import type { Market } from "@orakly/types";

/**
 * Pulls `price`/`quantity`/`side`/`outcome` out of the loosely-typed
 * `FeedActivityPayload.payload` blob. We cope with multiple historical
 * shapes (string vs number, missing fields) so the renderer never breaks.
 */
function extractTradeFields(p: unknown): {
  price: number;
  quantity: number;
  notionalUsd: number;
  side: "BUY" | "SELL";
  outcome: "YES" | "NO";
} | null {
  if (!p || typeof p !== "object") return null;
  const o = p as Record<string, unknown>;
  const price = parseDecimal(
    typeof o.price === "string" || typeof o.price === "number" ? o.price : null,
  );
  const quantity = parseDecimal(
    typeof o.quantity === "string" || typeof o.quantity === "number"
      ? o.quantity
      : null,
  );
  if (price <= 0 || quantity <= 0) return null;
  const notionalUsd =
    parseDecimal(
      typeof o.notionalUsd === "string" || typeof o.notionalUsd === "number"
        ? o.notionalUsd
        : null,
    ) || price * quantity;
  // `title` from the publisher is `${side} ${outcome}` — fall back to that.
  const sideField = typeof o.side === "string" ? o.side.toUpperCase() : "";
  const outcomeField = typeof o.outcome === "string" ? o.outcome.toUpperCase() : "";
  return {
    price,
    quantity,
    notionalUsd,
    side: sideField === "SELL" ? "SELL" : "BUY",
    outcome: outcomeField === "NO" ? "NO" : "YES",
  };
}

function extractFromTitle(
  title: string | null,
): { side: "BUY" | "SELL"; outcome: "YES" | "NO" } | null {
  if (!title) return null;
  const t = title.toUpperCase();
  const side: "BUY" | "SELL" = t.includes("SELL") ? "SELL" : "BUY";
  const outcome: "YES" | "NO" = t.includes("NO") ? "NO" : "YES";
  return { side, outcome };
}

/** Map a backend feed row → a typed `ActivityRow`. */
function feedRowToActivity(
  row: FeedActivityPayload,
  index: MarketsIndex,
): TradeActivityRow | UpdateActivityRow {
  const market = toActivityMarketRef(lookupMarket(index, row.marketId));

  if (row.activityType === "TRADE") {
    const fields = extractTradeFields(row.payload);
    const fromTitle = extractFromTitle(row.title);
    return {
      kind: "trade",
      id: row.activityId,
      at: row.at,
      side: fields?.side ?? fromTitle?.side ?? "BUY",
      outcome: fields?.outcome ?? fromTitle?.outcome ?? "YES",
      price: fields?.price ?? 0,
      quantity: fields?.quantity ?? 0,
      notionalUsd: fields?.notionalUsd ?? 0,
      market,
    };
  }

  return {
    kind: "update",
    id: row.activityId,
    at: row.at,
    variant: row.activityType,
    title: row.title ?? humanizeUpdateType(row.activityType),
    description: extractDescription(row.payload),
    market,
  };
}

function humanizeUpdateType(t: string): string {
  switch (t) {
    case "MARKET_RESOLVED":
      return "Market resolved";
    case "MARKET_CLOSED":
      return "Market closed";
    case "MARKET_CREATED":
      return "New market";
    case "POSITION_OPENED":
      return "Position opened";
    case "PAYOUT":
      return "Payout";
    default:
      return t.replaceAll("_", " ").toLowerCase();
  }
}

function extractDescription(p: unknown): string | undefined {
  if (!p || typeof p !== "object") return undefined;
  const o = p as Record<string, unknown>;
  if (typeof o.description === "string") return o.description;
  if (typeof o.message === "string") return o.message;
  return undefined;
}

function notificationToActivity(n: Notification): NotificationActivityRow {
  return {
    kind: "notification",
    id: `n:${n.id}`,
    at: isoToMs(n.at),
    variant: n.kind,
    title: n.title,
    description: n.body,
    href: n.href,
    read: n.read,
  };
}

export type BuildRowsInput = {
  feed: readonly FeedActivityPayload[];
  notifications: readonly Notification[];
  markets: readonly Market[] | undefined;
  /** Restrict to a single market by display id, slug or backend uuid. */
  marketScope?: string;
  /** Hard cap on rows kept after merge & sort. */
  maxRows?: number;
};

export type BuildRowsResult = {
  all: ActivityRow[];
  trades: TradeActivityRow[];
  updates: UpdateActivityRow[];
  yours: NotificationActivityRow[];
};

/**
 * Pure function — given the raw upstream sources, returns the categorized
 * activity rows ready for rendering. Stable identity per category so React
 * can short-circuit unchanged tabs.
 */
export function buildActivityRows(input: BuildRowsInput): BuildRowsResult {
  const { feed, notifications, markets, marketScope, maxRows = 80 } = input;
  const index = buildMarketsIndex(markets);

  const scopeMatches = (m: TradeActivityRow["market"], rowMarketId: string | null) => {
    if (!marketScope) return true;
    if (m && (m.slug === marketScope || m.id === marketScope)) return true;
    return rowMarketId === marketScope;
  };

  const trades: TradeActivityRow[] = [];
  const updates: UpdateActivityRow[] = [];

  for (const r of feed) {
    const mapped = feedRowToActivity(r, index);
    if (!scopeMatches(mapped.market, r.marketId)) continue;
    if (mapped.kind === "trade") trades.push(mapped);
    else updates.push(mapped);
  }

  // Notifications: scope only when explicit market scope provided _and_ the
  // notification carries the same slug.
  const yours: NotificationActivityRow[] = [];
  for (const n of notifications) {
    if (marketScope && n.marketSlug && n.marketSlug !== marketScope) continue;
    yours.push(notificationToActivity(n));
  }

  const all: ActivityRow[] = [...trades, ...updates, ...yours]
    .sort((a, b) => b.at - a.at)
    .slice(0, maxRows);

  return { all, trades, updates, yours };
}
