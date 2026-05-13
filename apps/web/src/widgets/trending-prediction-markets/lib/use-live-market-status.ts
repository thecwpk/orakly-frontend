"use client";

import { useEffect, useMemo, useState } from "react";
import { useLiveActivityFeed } from "@/websocket/hooks/useLiveActivityFeed";

const LIVE_WINDOW_MS = 30_000;

/**
 * Reduces the realtime activity feed into a per-market `lastTradeAt` map and
 * a tick that re-evaluates "is live" once per second. The reducer runs once
 * per feed-store notification (cheap), and the tick only flips boolean
 * results, so the cost is bounded even with hundreds of cards.
 */
export function useLiveMarketStatus(marketIds: ReadonlyArray<string>): {
  liveSet: ReadonlySet<string>;
  lastTradeAt: ReadonlyMap<string, number>;
} {
  const feed = useLiveActivityFeed();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  return useMemo(() => {
    const wanted = new Set(marketIds);
    const lastByMarket = new Map<string, number>();
    for (const row of feed) {
      const id = row.marketId;
      if (!id || !wanted.has(id)) continue;
      const prev = lastByMarket.get(id) ?? 0;
      if (row.at > prev) lastByMarket.set(id, row.at);
    }
    const live = new Set<string>();
    for (const [id, at] of lastByMarket) {
      if (now - at <= LIVE_WINDOW_MS) live.add(id);
    }
    return { liveSet: live, lastTradeAt: lastByMarket };
  }, [feed, marketIds, now]);
}
