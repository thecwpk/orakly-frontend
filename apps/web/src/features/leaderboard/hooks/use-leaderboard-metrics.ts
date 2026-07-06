"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import {
  fetchCreatorLeaderboard,
  fetchTraderLeaderboard,
  type TraderLeaderboardSort,
} from "@/shared/api/fetchers/leaderboard";
import { queryKeys } from "@/shared/api/query-keys";
import { mapLeaderboardRow } from "../lib/map-trader-row";
import type { LeaderboardMetricTab, LeaderboardWindow } from "../lib/types";
import type { CreatorRow, TraderRow } from "../components/leaderboard-metric-tables";

const DISPLAY_LIMIT = 20;
const FETCH_LIMIT = 100;

function toTraderRow(
  trader: ReturnType<typeof mapLeaderboardRow>,
  rank: number,
): TraderRow {
  return {
    rank,
    address: trader.address,
    volumeUsd: trader.volumeUsd,
    tradeCount: trader.tradeCount,
    winRatePct: trader.winRatePct,
    pnlUsd: trader.pnlUsd,
    bestTradeUsd: trader.bestTradeUsd,
    marketsTraded: trader.marketsTraded,
  };
}

function tabSort(tab: LeaderboardMetricTab): TraderLeaderboardSort {
  if (tab === "winRate") return "winRate";
  if (tab === "pnl") return "pnl";
  return "volume";
}

export function useLeaderboardMetricTab(
  tab: LeaderboardMetricTab,
  window: LeaderboardWindow,
) {
  const { address: connectedAddress } = useAccount();
  const sort = tabSort(tab);

  const tradersQuery = useQuery({
    queryKey: [...queryKeys.leaderboard.traders(window), sort, tab === "winRate" ? 5 : 0],
    queryFn: () =>
      fetchTraderLeaderboard({
        window,
        take: FETCH_LIMIT,
        sort,
        minTrades: tab === "winRate" ? 5 : 0,
      }),
    enabled: tab !== "creators",
    staleTime: 30_000,
  });

  const creatorsQuery = useQuery({
    queryKey: queryKeys.leaderboard.creators(),
    queryFn: () => fetchCreatorLeaderboard(FETCH_LIMIT),
    enabled: tab === "creators",
    staleTime: 30_000,
  });

  const traderRows = useMemo(() => {
    const rows = tradersQuery.data ?? [];
    return rows.map((row, index) => toTraderRow(mapLeaderboardRow(row, index + 1), index + 1));
  }, [tradersQuery.data]);

  const creatorRows = useMemo((): CreatorRow[] => {
    return (creatorsQuery.data ?? []).map((row, index) => ({
      rank: index + 1,
      address: row.creatorAddress,
      approvedMarkets: row.marketCount,
      volumeGenerated: row.totalVolumeUsd,
      feesEarned: row.feesEarned,
    }));
  }, [creatorsQuery.data]);

  const displayTraderRows = traderRows.slice(0, DISPLAY_LIMIT);
  const displayCreatorRows = creatorRows.slice(0, DISPLAY_LIMIT);

  const yourTraderRank = useMemo(() => {
    if (!connectedAddress) return { row: null, rank: null };
    const normalized = connectedAddress.toLowerCase();
    const index = traderRows.findIndex((row) => row.address.toLowerCase() === normalized);
    if (index < 0) return { row: null, rank: null };
    return { row: traderRows[index]!, rank: index + 1 };
  }, [connectedAddress, traderRows]);

  const yourCreatorRank = useMemo(() => {
    if (!connectedAddress) return { row: null, rank: null };
    const normalized = connectedAddress.toLowerCase();
    const index = creatorRows.findIndex((row) => row.address.toLowerCase() === normalized);
    if (index < 0) return { row: null, rank: null };
    return { row: creatorRows[index]!, rank: index + 1 };
  }, [connectedAddress, creatorRows]);

  return {
    isLoading: tab === "creators" ? creatorsQuery.isLoading : tradersQuery.isLoading,
    displayTraderRows,
    displayCreatorRows,
    yourTraderRank,
    yourCreatorRank,
    connectedAddress: connectedAddress ?? null,
  };
}
