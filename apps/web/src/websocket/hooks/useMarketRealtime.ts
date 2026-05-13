"use client";

import { useSyncExternalStore } from "react";
import {
  getMarketRealtimeSnapshot,
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
  return useSyncExternalStore(
    (cb) => subscribeMarketRealtime(marketId, cb),
    () => (marketId ? getMarketRealtimeSnapshot(marketId) : SSR_SNAPSHOT),
    () => SSR_SNAPSHOT,
  );
}
