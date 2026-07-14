import type { FeedActivityPayload } from "@orakly/realtime-protocol";
import type {
  MarketActivityEvent,
  MarketActivityKind,
} from "./market-activity";

function truncate(text: string, max: number): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function toNum(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function payloadObj(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  return {};
}

export function normalizeMarketActivityKind(
  raw: string,
): MarketActivityKind | null {
  const t = raw.trim().toUpperCase();
  if (
    t === "TRADE" ||
    t === "MARKET_APPROVED" ||
    t === "MARKET_CREATED" ||
    t === "MARKET_CLOSING" ||
    t === "COMMUNITY_VOTE" ||
    t === "UPCOMING_EVENT"
  ) {
    return t;
  }
  return null;
}

export function marketActivityToFeedPayload(
  e: MarketActivityEvent,
): FeedActivityPayload {
  return {
    activityId: e.id,
    marketId: null,
    activityType: e.kind,
    title: e.question,
    payload: { ...e },
    at: new Date(e.at).getTime(),
  };
}

export function feedPayloadToMarketActivity(
  row: FeedActivityPayload,
): MarketActivityEvent | null {
  const kind = normalizeMarketActivityKind(row.activityType);
  if (!kind) {
    // Legacy TRADE publisher shape without new kind field
    if (row.activityType === "TRADE") {
      const p = payloadObj(row.payload);
      return {
        id: row.activityId,
        kind: "TRADE",
        at: new Date(row.at).toISOString(),
        question: truncate(row.title ?? "Market", 55),
        marketSlug:
          (typeof p.marketSlug === "string" && p.marketSlug) ||
          (typeof p.slug === "string" && p.slug) ||
          null,
        walletAddress:
          (typeof p.walletAddress === "string" && p.walletAddress) || null,
        outcome: p.outcome === "NO" ? "NO" : "YES",
        amountBnb:
          typeof p.amountBnb === "number"
            ? p.amountBnb
            : toNum(p.notionalUsd) || null,
      };
    }
    return null;
  }

  const p = payloadObj(row.payload);
  const question =
    (typeof p.question === "string" && p.question) || row.title || "Market";

  return {
    id: row.activityId,
    kind,
    at: new Date(row.at).toISOString(),
    question: truncate(question, kind === "COMMUNITY_VOTE" ? 45 : 55),
    marketSlug:
      (typeof p.marketSlug === "string" && p.marketSlug) ||
      (typeof p.slug === "string" && p.slug) ||
      null,
    walletAddress:
      (typeof p.walletAddress === "string" && p.walletAddress) ||
      (typeof p.address === "string" && p.address) ||
      null,
    outcome: p.outcome === "NO" || p.outcome === "YES" ? p.outcome : null,
    amountBnb:
      typeof p.amountBnb === "number"
        ? p.amountBnb
        : toNum(p.notionalUsd) || null,
    category: typeof p.category === "string" ? p.category : null,
    hoursUntilClose:
      typeof p.hoursUntilClose === "number" ? p.hoursUntilClose : null,
    volumeUsd:
      typeof p.volumeUsd === "number" ? p.volumeUsd : toNum(p.volumeUsd) || null,
    voteCount: typeof p.voteCount === "number" ? p.voteCount : null,
    suggestionId: typeof p.suggestionId === "string" ? p.suggestionId : null,
    eventName: typeof p.eventName === "string" ? p.eventName : question,
    eventWhenLabel:
      typeof p.eventWhenLabel === "string" ? p.eventWhenLabel : null,
  };
}
