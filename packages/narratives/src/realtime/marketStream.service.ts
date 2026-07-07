import type { IngestEnvelope } from "@orakly/realtime-protocol";
import type { TradeCreatedPayload } from "../events/eventBus.service.js";
import type {
  AttentionUpdatedPayload,
  LedgerUpdatedPayload,
  MarketResolvedPayload,
  ProbabilityUpdatedPayload,
} from "../events/eventBus.service.js";

function ingestUrl(): string | null {
  const raw = process.env.REALTIME_INGEST_URL?.trim();
  return raw ? raw.replace(/\/$/, "") : null;
}

function ingestSecret(): string | null {
  const s = process.env.REALTIME_INGEST_SECRET?.trim();
  return s || null;
}

async function postIngest(envelopes: IngestEnvelope[]): Promise<void> {
  const base = ingestUrl();
  const secret = ingestSecret();
  if (!base || !secret || envelopes.length === 0) return;

  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 3_000);
  try {
    await fetch(`${base}/internal/ingest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify({ envelopes }),
      signal: ac.signal,
    });
  } catch (err) {
    console.warn("[marketStream] ingest failed", err);
  } finally {
    clearTimeout(t);
  }
}

function attentionFeedEnvelope(
  p: AttentionUpdatedPayload,
): IngestEnvelope {
  const at = Date.now();
  return {
    v: 1,
    kind: "feed_activity",
    activity: {
      activityId: `attention:${at}`,
      marketId: null,
      activityType: "dashboard:attention:update",
      title: "Attention scores updated",
      payload: {
        event: "dashboard:attention:update",
        narratives: p.narratives,
      },
      at,
    },
  };
}

export const marketStream = {
  async emitTradeNew(p: TradeCreatedPayload): Promise<void> {
    const at = Date.now();
    const envelopes: IngestEnvelope[] = [
      {
        v: 1,
        kind: "trade_instant",
        marketId: p.marketId,
        trade: {
          tradeId: p.tradeId,
          side: "BUY",
          outcome: p.outcome,
          price: p.price,
          quantity: p.quantity,
          notionalUsd: p.notionalUsd,
          at,
        },
      },
      {
        v: 1,
        kind: "feed_activity",
        activity: {
          activityId: p.tradeId,
          marketId: p.marketId,
          activityType: "market:trade:new",
          title: `Trade ${p.outcome}`,
          payload: {
            event: "market:trade:new",
            tradeId: p.tradeId,
            marketId: p.marketId,
            userId: p.userId,
            probability: p.probability,
          },
          at,
        },
      },
      {
        v: 1,
        kind: "portfolio_refresh",
        portfolio: { userId: p.userId, reason: "trade", at },
      },
    ];
    await postIngest(envelopes);
  },

  async emitProbabilityUpdate(p: ProbabilityUpdatedPayload): Promise<void> {
    const at = Date.now();
    const yes = p.result.probability.toFixed(4);
    const no = (1 - p.result.probability).toFixed(4);
    const envelopes: IngestEnvelope[] = [
      {
        v: 1,
        kind: "rt_batch",
        marketId: p.marketId,
        items: [
          {
            t: "odds",
            yesPrice: yes,
            noPrice: no,
            liquidityUsd: "0",
            collateralPoolUsd: "0",
            volume24hUsd: "0",
            volumeTotalUsd: "0",
            at,
          },
        ],
      },
      {
        v: 1,
        kind: "feed_activity",
        activity: {
          activityId: `prob:${p.marketId}:${at}`,
          marketId: p.marketId,
          activityType: "market:probability:update",
          title: "Probability updated",
          payload: {
            event: "market:probability:update",
            marketId: p.marketId,
            probability: p.result.probability,
            probabilityPct: p.result.probabilityPct,
          },
          at,
        },
      },
      {
        v: 1,
        kind: "feed_activity",
        activity: {
          activityId: `price:${p.marketId}:${at}`,
          marketId: p.marketId,
          activityType: "market:price:update",
          title: "Price updated",
          payload: {
            event: "market:price:update",
            marketId: p.marketId,
            yesPrice: yes,
            noPrice: no,
          },
          at,
        },
      },
    ];
    await postIngest(envelopes);
  },

  async emitResolutionUpdate(p: MarketResolvedPayload): Promise<void> {
    const at = Date.now();
    const envelopes: IngestEnvelope[] = [
      {
        v: 1,
        kind: "market_meta",
        meta: {
          marketId: p.marketId,
          status: p.status,
          resolvedOutcome: p.resolvedOutcome,
          resolvedAt: new Date(at).toISOString(),
          at,
        },
      },
      {
        v: 1,
        kind: "feed_activity",
        activity: {
          activityId: `resolve:${p.marketId}:${at}`,
          marketId: p.marketId,
          activityType: "market:resolution:update",
          title: "Market resolved",
          payload: {
            event: "market:resolution:update",
            marketId: p.marketId,
            resolvedOutcome: p.resolvedOutcome,
            status: p.status,
          },
          at,
        },
      },
    ];
    await postIngest(envelopes);
  },

  async emitAttentionUpdate(p: AttentionUpdatedPayload): Promise<void> {
    await postIngest([attentionFeedEnvelope(p)]);
  },

  async emitLedgerUpdated(p: LedgerUpdatedPayload): Promise<void> {
    const at = Date.now();
    const envelopes: IngestEnvelope[] = [
      {
        v: 1,
        kind: "portfolio_refresh",
        portfolio: {
          userId: p.userId,
          reason:
            p.type === "DEPOSIT"
              ? "deposit"
              : p.type === "WITHDRAW"
                ? "withdrawal"
                : "unknown",
          at,
        },
      },
      {
        v: 1,
        kind: "feed_activity",
        activity: {
          activityId: `ledger:${p.userId}:${at}`,
          marketId: null,
          activityType: "user:ledger:update",
          title: "Ledger updated",
          payload: {
            event: "user:ledger:update",
            userId: p.userId,
            type: p.type,
            amount: p.amount,
            txHash: p.txHash,
          },
          at,
        },
      },
    ];
    await postIngest(envelopes);
  },
};
