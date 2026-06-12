"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { fetchTraderLeaderboard } from "@/shared/api/fetchers/leaderboard";
import { queryKeys } from "@/shared/api/query-keys";
import {
  mapLeaderboardRow,
  summarizeTraderRows,
} from "../lib/map-trader-row";
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
  flux: { climbed: number; dropped: number; held: number };
  isLoading: boolean;
  isError: boolean;
};

export function useLeaderboard({
  window: timeWindow,
  sort,
}: {
  window: LeaderboardWindow;
  sort: LeaderboardSortKey;
}): UseLeaderboardResult {
  const previousRanks = useRef<Map<string, number>>(new Map());
  const [, setVersion] = useState(0);

  const query = useQuery({
    queryKey: queryKeys.leaderboard.traders(timeWindow),
    queryFn: () => fetchTraderLeaderboard({ window: timeWindow, take: 100 }),
    staleTime: 30_000,
  });

  const traders = useMemo(() => {
    const rows = query.data ?? [];
    return rows.map((r, i) => mapLeaderboardRow(r, i + 1));
  }, [query.data]);

  const rows = useMemo(
    () =>
      rankTraders({
        traders,
        sort,
        previousRanks: previousRanks.current,
      }),
    [traders, sort],
  );

  useEffect(() => {
    previousRanks.current = snapshotRanks(rows);
    const id = window.setTimeout(() => setVersion((v) => v + 1), 1500);
    return () => window.clearTimeout(id);
  }, [rows]);

  const podium = rows.slice(0, 3);
  const rest = rows.slice(3);
  const totals = useMemo(() => summarizeTraderRows(rows), [rows]);

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

  return {
    rows,
    podium,
    rest,
    totals,
    flux,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
