"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { buildTradersForWindow, summarizeTraders } from "../lib/mock-data";
import { rankTraders, snapshotRanks } from "../lib/sort";
import type { LeaderboardSortKey, LeaderboardWindow, RankedTrader } from "../lib/types";

export type UseLeaderboardResult = {
  rows: RankedTrader[];
  podium: RankedTrader[];
  rest: RankedTrader[];
  totals: {
    totalVolumeUsd: number;
    totalPnlUsd: number;
    averageWinRate: number;
    totalTrades: number;
  };
  /** Movement summary used by the KPI strip — counts of climbers / sliders. */
  flux: { climbed: number; dropped: number; held: number };
};

/**
 * Computes the ranked + window-scoped trader list and tracks rank deltas
 * across re-renders so the table can animate movement smoothly.
 */
export function useLeaderboard({
  window: timeWindow,
  sort,
}: {
  window: LeaderboardWindow;
  sort: LeaderboardSortKey;
}): UseLeaderboardResult {
  const previousRanks = useRef<Map<string, number>>(new Map());
  // Forces a re-render whenever the previous-ranks map is updated, so rows
  // recompute their delta after the first paint that follows a sort change.
  const [, setVersion] = useState(0);

  const traders = useMemo(() => buildTradersForWindow(timeWindow), [timeWindow]);

  const rows = useMemo(
    () =>
      rankTraders({
        traders,
        sort,
        previousRanks: previousRanks.current,
      }),
    [traders, sort],
  );

  // Snapshot the current ranks AFTER paint so the next sort/window change can
  // diff against this state — `useEffect` defers this past the render commit.
  useEffect(() => {
    previousRanks.current = snapshotRanks(rows);
    // Trigger one extra render so the rank-delta indicators clear after
    // animating in.
    const id = window.setTimeout(() => setVersion((v) => v + 1), 1500);
    return () => window.clearTimeout(id);
  }, [rows]);

  const podium = rows.slice(0, 3);
  const rest = rows.slice(3);

  const totals = useMemo(() => summarizeTraders(rows), [rows]);

  const flux = useMemo(() => {
    let climbed = 0;
    let dropped = 0;
    let held = 0;
    for (const r of rows) {
      if (r.rankDelta > 0) climbed += 1;
      else if (r.rankDelta < 0) dropped += 1;
      else held += 1;
    }
    return { climbed, dropped, held };
  }, [rows]);

  return { rows, podium, rest, totals, flux };
}
