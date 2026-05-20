"use client";

import { useSyncExternalStore } from "react";
import {
  getMarketRealtimeSnapshot,
  getMarketRealtimeStoreRev,
  subscribeMarketRealtime,
  type MarketRealtimeSnapshot,
} from "../store/market-realtime-store";

const SSR_SNAPSHOT: MarketRealtimeSnapshot = {
  marketId: "",
  seq: 0,
  odds: null,
  lastTrade: null,
  tradesRecent: [],
  meta: null,
};

/** Odds + liquidity + volumes + recent trades for one market — one external-store notify per batch. */
export function useMarketRealtime(marketId: string | undefined) {
  const rev = useSyncExternalStore(
    (cb) => subscribeMarketRealtime(marketId, cb),
    () => getMarketRealtimeStoreRev(marketId),
    () => 0,
  );

  void rev;

  return marketId ? getMarketRealtimeSnapshot(marketId) : SSR_SNAPSHOT;
}
