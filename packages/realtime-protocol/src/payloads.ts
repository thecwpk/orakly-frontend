/**
 * One batched envelope per market room — clients apply in one store update
 * to minimize React rerenders.
 */
export type RtBatchItem =
  | {
      t: "odds";
      yesPrice: string;
      noPrice: string;
      liquidityUsd: string;
      collateralPoolUsd: string;
      volume24hUsd: string;
      volumeTotalUsd: string;
      at: number;
    }
  | {
      t: "trade";
      tradeId: string;
      side: "BUY" | "SELL";
      outcome: "YES" | "NO";
      price: string;
      quantity: string;
      notionalUsd: string;
      at: number;
    }
  | {
      t: "activity";
      activityId: string;
      activityType: string;
      title: string | null;
      payload: unknown;
      at: number;
    }
  | {
      t: "market";
      status?: string;
      closesAt?: string | null;
      resolvedOutcome?: "YES" | "NO" | null;
      at: number;
    };

export type RtBatchPayload = {
  marketId: string;
  seq: number;
  items: RtBatchItem[];
};

export type TradeInstantPayload = {
  marketId: string;
  tradeId: string;
  side: "BUY" | "SELL";
  outcome: "YES" | "NO";
  price: string;
  quantity: string;
  notionalUsd: string;
  at: number;
};

export type FeedActivityPayload = {
  activityId: string;
  marketId: string | null;
  activityType: string;
  title: string | null;
  payload: unknown;
  at: number;
};

export type MarketMetaPayload = {
  marketId: string;
  status?: string;
  closesAt?: string | null;
  resolvedOutcome?: "YES" | "NO" | null;
  resolvedAt?: string | null;
  at: number;
};

export type PortfolioRefreshPayload = {
  userId: string;
  reason:
    | "trade"
    | "resolution"
    | "deposit"
    | "withdrawal"
    | "onchain"
    | "unknown";
  at: number;
};

/** HTTP ingest from API workers (Vercel) → realtime service. */
export type IngestEnvelope =
  | {
      v: 1;
      kind: "rt_batch";
      marketId: string;
      items: RtBatchItem[];
    }
  | {
      v: 1;
      kind: "trade_instant";
      marketId: string;
      trade: {
        tradeId: string;
        side: "BUY" | "SELL";
        outcome: "YES" | "NO";
        price: string;
        quantity: string;
        notionalUsd: string;
        at: number;
      };
    }
  | {
      v: 1;
      kind: "feed_activity";
      activity: FeedActivityPayload;
    }
  | {
      v: 1;
      kind: "market_meta";
      meta: MarketMetaPayload;
    }
  | {
      v: 1;
      kind: "portfolio_refresh";
      portfolio: PortfolioRefreshPayload;
    };
