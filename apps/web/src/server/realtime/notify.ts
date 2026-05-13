import type { IngestEnvelope } from "@orakly/realtime-protocol";
import type { ResolutionSnapshot } from "../trading/settlement.service";
import type { TradeExecutionSnapshot } from "../trading/trade.service";

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
  } finally {
    clearTimeout(t);
  }
}

/** Fire-and-forget path from API routes after trades commit. */
export function publishTradeRealtime(
  snapshot: TradeExecutionSnapshot,
  userId: string,
): void {
  const at = Date.now();
  const envelopes: IngestEnvelope[] = [
    {
      v: 1,
      kind: "trade_instant",
      marketId: snapshot.marketId,
      trade: {
        tradeId: snapshot.tradeId,
        side: snapshot.direction,
        outcome: snapshot.outcome,
        price: snapshot.executedPrice,
        quantity: snapshot.quantity,
        notionalUsd: snapshot.notionalUsd,
        at,
      },
    },
    {
      v: 1,
      kind: "rt_batch",
      marketId: snapshot.marketId,
      items: [
        {
          t: "odds",
          yesPrice: snapshot.odds.yesPrice,
          noPrice: snapshot.odds.noPrice,
          liquidityUsd: snapshot.liquidityUsd,
          collateralPoolUsd: snapshot.collateralPoolUsd,
          volume24hUsd: snapshot.volume24hUsd,
          volumeTotalUsd: snapshot.volumeTotalUsd,
          at,
        },
        {
          t: "trade",
          tradeId: snapshot.tradeId,
          side: snapshot.direction,
          outcome: snapshot.outcome,
          price: snapshot.executedPrice,
          quantity: snapshot.quantity,
          notionalUsd: snapshot.notionalUsd,
          at,
        },
      ],
    },
    {
      v: 1,
      kind: "feed_activity",
      activity: {
        activityId: snapshot.tradeId,
        marketId: snapshot.marketId,
        activityType: "TRADE",
        title: `${snapshot.direction} ${snapshot.outcome}`,
        payload: {
          tradeId: snapshot.tradeId,
          marketId: snapshot.marketId,
          price: snapshot.executedPrice,
          quantity: snapshot.quantity,
        },
        at,
      },
    },
    {
      v: 1,
      kind: "portfolio_refresh",
      portfolio: { userId, reason: "trade", at },
    },
  ];

  void postIngest(envelopes).catch((err) => {
    console.error("[realtime] publishTradeRealtime failed", err);
  });
}

export function publishMarketResolved(
  snapshot: ResolutionSnapshot,
  affectedUserIds: string[],
): void {
  const at = Date.now();
  const envelopes: IngestEnvelope[] = [
    {
      v: 1,
      kind: "market_meta",
      meta: {
        marketId: snapshot.marketId,
        status: "RESOLVED",
        resolvedOutcome: snapshot.outcome,
        resolvedAt: new Date(at).toISOString(),
        at,
      },
    },
    {
      v: 1,
      kind: "rt_batch",
      marketId: snapshot.marketId,
      items: [
        {
          t: "market",
          status: "RESOLVED",
          resolvedOutcome: snapshot.outcome,
          at,
        },
      ],
    },
  ];

  const seen = new Set<string>();
  for (const userId of affectedUserIds) {
    if (seen.has(userId)) continue;
    seen.add(userId);
    envelopes.push({
      v: 1,
      kind: "portfolio_refresh",
      portfolio: { userId, reason: "resolution", at },
    });
  }

  void postIngest(envelopes).catch((err) => {
    console.error("[realtime] publishMarketResolved failed", err);
  });
}
