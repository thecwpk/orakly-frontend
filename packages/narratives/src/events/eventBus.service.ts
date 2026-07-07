import { cacheManager } from "../cache/cacheManager.service.js";
import type { MarketProbabilityResult } from "../engines/probabilityEngine.service.js";
import { marketStream } from "../realtime/marketStream.service.js";

export const SystemEvents = {
  TRADE_CREATED: "TRADE_CREATED",
  PROBABILITY_UPDATED: "PROBABILITY_UPDATED",
  MARKET_RESOLVED: "MARKET_RESOLVED",
  LEDGER_UPDATED: "LEDGER_UPDATED",
  ATTENTION_UPDATED: "ATTENTION_UPDATED",
} as const;

export type SystemEventName =
  (typeof SystemEvents)[keyof typeof SystemEvents];

export type TradeCreatedPayload = {
  marketId: string;
  tradeId: string;
  userId: string;
  outcome: "YES" | "NO";
  price: string;
  quantity: string;
  notionalUsd: string;
  probability: string;
};

export type ProbabilityUpdatedPayload = {
  marketId: string;
  result: MarketProbabilityResult;
};

export type MarketResolvedPayload = {
  marketId: string;
  resolvedOutcome: "YES" | "NO";
  status: string;
};

export type AttentionUpdatedPayload = {
  narratives: Array<{ narrative: string; score: number }>;
};

export type LedgerUpdatedPayload = {
  userId: string;
  type: string;
  amount: string;
  txHash: string | null;
};

type EventPayloadMap = {
  [SystemEvents.TRADE_CREATED]: TradeCreatedPayload;
  [SystemEvents.PROBABILITY_UPDATED]: ProbabilityUpdatedPayload;
  [SystemEvents.MARKET_RESOLVED]: MarketResolvedPayload;
  [SystemEvents.LEDGER_UPDATED]: LedgerUpdatedPayload;
  [SystemEvents.ATTENTION_UPDATED]: AttentionUpdatedPayload;
};

type Handler<K extends SystemEventName> = (
  payload: EventPayloadMap[K],
) => void | Promise<void>;

const handlers = new Map<SystemEventName, Handler<SystemEventName>[]>();

function on<K extends SystemEventName>(
  event: K,
  handler: Handler<K>,
): void {
  const list = handlers.get(event) ?? [];
  list.push(handler as Handler<SystemEventName>);
  handlers.set(event, list);
}

async function emit<K extends SystemEventName>(
  event: K,
  payload: EventPayloadMap[K],
): Promise<void> {
  const list = handlers.get(event) ?? [];
  await Promise.all(
    list.map((h) =>
      Promise.resolve(h(payload)).catch((err) => {
        console.warn(`[eventBus] ${event} handler failed`, err);
      }),
    ),
  );
}

on(SystemEvents.TRADE_CREATED, async (p) => {
  await cacheManager.onTradeCreated(p.marketId);
  await cacheManager.onLedgerUpdated(p.userId);
  await marketStream.emitTradeNew(p);
});

on(SystemEvents.PROBABILITY_UPDATED, async (p) => {
  await cacheManager.writeThroughProbability(p.marketId, p.result);
  await marketStream.emitProbabilityUpdate(p);
});

on(SystemEvents.MARKET_RESOLVED, async (p) => {
  await cacheManager.onMarketResolved(p.marketId);
  await marketStream.emitResolutionUpdate(p);
});

on(SystemEvents.LEDGER_UPDATED, async (p) => {
  await cacheManager.onLedgerUpdated(p.userId);
  await marketStream.emitLedgerUpdated(p);
});

on(SystemEvents.ATTENTION_UPDATED, async (p) => {
  await cacheManager.invalidateDashboardAttention();
  await cacheManager.invalidateDashboardTrends();
  await marketStream.emitAttentionUpdate(p);
});

export const eventBus = {
  emit,
  on,
  SystemEvents,
};
