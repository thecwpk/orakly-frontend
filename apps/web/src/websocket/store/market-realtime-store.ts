import type {
  MarketMetaPayload,
  RtBatchItem,
  RtBatchPayload,
  TradeInstantPayload,
} from "@orakly/realtime-protocol";

export type MarketRealtimeSnapshot = {
  marketId: string;
  seq: number;
  odds: {
    yesPrice: string;
    noPrice: string;
    liquidityUsd: string;
    collateralPoolUsd: string;
    volume24hUsd: string;
    volumeTotalUsd: string;
    at: number;
  } | null;
  lastTrade: {
    tradeId: string;
    side: "BUY" | "SELL";
    outcome: "YES" | "NO";
    price: string;
    quantity: string;
    notionalUsd: string;
    at: number;
  } | null;
  tradesRecent: Array<{
    tradeId: string;
    side: "BUY" | "SELL";
    outcome: "YES" | "NO";
    price: string;
    quantity: string;
    notionalUsd: string;
    at: number;
  }>;
  meta: {
    status?: string;
    closesAt?: string | null;
    resolvedOutcome?: "YES" | "NO" | null;
    resolvedAt?: string | null;
    at: number;
  } | null;
};

const DEFAULT_SNAPSHOT: MarketRealtimeSnapshot = {
  marketId: "",
  seq: 0,
  odds: null,
  lastTrade: null,
  tradesRecent: [],
  meta: null,
};

type Bucket = {
  snapshot: MarketRealtimeSnapshot;
  listeners: Set<() => void>;
};

const buckets = new Map<string, Bucket>();

function ensureBucket(marketId: string): Bucket {
  let b = buckets.get(marketId);
  if (!b) {
    b = {
      snapshot: {
        marketId,
        seq: 0,
        odds: null,
        lastTrade: null,
        tradesRecent: [],
        meta: null,
      },
      listeners: new Set(),
    };
    buckets.set(marketId, b);
  }
  return b;
}

function emit(bucket: Bucket) {
  for (const fn of bucket.listeners) fn();
}

function applyItem(snap: MarketRealtimeSnapshot, item: RtBatchItem) {
  switch (item.t) {
    case "odds":
      snap.odds = {
        yesPrice: item.yesPrice,
        noPrice: item.noPrice,
        liquidityUsd: item.liquidityUsd,
        collateralPoolUsd: item.collateralPoolUsd,
        volume24hUsd: item.volume24hUsd,
        volumeTotalUsd: item.volumeTotalUsd,
        at: item.at,
      };
      break;
    case "trade": {
      const row = {
        tradeId: item.tradeId,
        side: item.side,
        outcome: item.outcome,
        price: item.price,
        quantity: item.quantity,
        notionalUsd: item.notionalUsd,
        at: item.at,
      };
      snap.lastTrade = row;
      snap.tradesRecent = [row, ...snap.tradesRecent].slice(0, 40);
      break;
    }
    case "activity":
      break;
    case "market":
      snap.meta = {
        ...snap.meta,
        status: item.status ?? snap.meta?.status,
        closesAt:
          item.closesAt !== undefined ? item.closesAt : snap.meta?.closesAt,
        resolvedOutcome:
          item.resolvedOutcome !== undefined ?
            item.resolvedOutcome
          : snap.meta?.resolvedOutcome,
        at: item.at,
      };
      break;
    default:
      break;
  }
}

export function subscribeMarketRealtime(
  marketId: string | undefined,
  cb: () => void,
): () => void {
  if (!marketId) return () => {};
  const b = ensureBucket(marketId);
  b.listeners.add(cb);
  return () => {
    b.listeners.delete(cb);
    if (b.listeners.size === 0) {
      buckets.delete(marketId);
    }
  };
}

/** Stable reference for “no market” — never spread `DEFAULT_SNAPSHOT` per read (breaks useSyncExternalStore). */
export const EMPTY_MARKET_REALTIME_SNAPSHOT: MarketRealtimeSnapshot = {
  ...DEFAULT_SNAPSHOT,
};

export function getMarketRealtimeSnapshot(
  marketId: string | undefined,
): MarketRealtimeSnapshot {
  if (!marketId) return EMPTY_MARKET_REALTIME_SNAPSHOT;
  return ensureBucket(marketId).snapshot;
}

export function applyRtBatch(payload: RtBatchPayload) {
  const b = ensureBucket(payload.marketId);
  if (payload.seq <= b.snapshot.seq) return;
  b.snapshot.seq = payload.seq;
  for (const item of payload.items) {
    applyItem(b.snapshot, item);
  }
  emit(b);
}

export function applyTradeInstant(p: TradeInstantPayload) {
  const b = ensureBucket(p.marketId);
  const row = {
    tradeId: p.tradeId,
    side: p.side,
    outcome: p.outcome,
    price: p.price,
    quantity: p.quantity,
    notionalUsd: p.notionalUsd,
    at: p.at,
  };
  b.snapshot.lastTrade = row;
  b.snapshot.tradesRecent = [row, ...b.snapshot.tradesRecent].slice(0, 40);
  emit(b);
}

export function applyMarketMeta(p: MarketMetaPayload) {
  const b = ensureBucket(p.marketId);
  b.snapshot.meta = {
    status: p.status ?? b.snapshot.meta?.status,
    closesAt: p.closesAt ?? b.snapshot.meta?.closesAt,
    resolvedOutcome: p.resolvedOutcome ?? b.snapshot.meta?.resolvedOutcome,
    resolvedAt: p.resolvedAt ?? b.snapshot.meta?.resolvedAt,
    at: p.at,
  };
  emit(b);
}

const OPTIMISTIC_PRINT_PREFIX = "optimistic-local:";

/** Client-only tape line so fills feel instant before WS / REST reconcile. */
export function injectOptimisticTradePrint(
  marketId: string,
  print: Omit<MarketRealtimeSnapshot["tradesRecent"][number], "tradeId"> & {
    tradeId?: string;
  },
) {
  const b = ensureBucket(marketId);
  const tradeId =
    print.tradeId ??
    `${OPTIMISTIC_PRINT_PREFIX}${typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Date.now()}`;
  const row = { ...print, tradeId };
  b.snapshot.lastTrade = row;
  b.snapshot.tradesRecent = [row, ...b.snapshot.tradesRecent].slice(0, 40);
  b.snapshot.seq += 1;
  emit(b);
}

/** Drop optimistic prints after server ack or rollback (avoid duplicate lines). */
export function stripOptimisticTradePrints(marketId: string) {
  const b = buckets.get(marketId);
  if (!b) return;
  const next = b.snapshot.tradesRecent.filter(
    (t) => !t.tradeId.startsWith(OPTIMISTIC_PRINT_PREFIX),
  );
  if (next.length === b.snapshot.tradesRecent.length) return;
  b.snapshot.tradesRecent = next;
  if (b.snapshot.lastTrade?.tradeId.startsWith(OPTIMISTIC_PRINT_PREFIX)) {
    b.snapshot.lastTrade = next[0] ?? null;
  }
  b.snapshot.seq += 1;
  emit(b);
}
