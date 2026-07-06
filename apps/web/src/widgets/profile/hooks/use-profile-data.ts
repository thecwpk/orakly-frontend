"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { fetchTraderProfile } from "@/shared/api/fetchers/trader-profile";
import { queryKeys } from "@/shared/api/query-keys";
import type { TraderProfile } from "../lib/types";

function toProfileTrade(
  trade: Awaited<ReturnType<typeof fetchTraderProfile>>["trades"][number],
) {
  return {
    id: trade.id,
    marketSlug: trade.marketSlug,
    marketTitle: trade.marketTitle,
    marketCategory: trade.marketCategory,
    side: trade.side,
    action: "BUY" as const,
    sizeUsd: trade.amountUsd,
    pnlUsd: trade.status === "won" ? trade.amountUsd : trade.status === "lost" ? -trade.amountUsd : 0,
    at: trade.at,
  };
}

export function useProfileData(address?: string) {
  const { address: connectedAddress } = useAccount();
  const normalizedConnected = connectedAddress?.toLowerCase() ?? null;
  const targetAddress = (address ?? normalizedConnected)?.toLowerCase() ?? null;
  const isMine =
    Boolean(normalizedConnected) &&
    (!address || address.toLowerCase() === normalizedConnected);

  const profileQuery = useQuery({
    queryKey: queryKeys.profile.byAddress(targetAddress ?? ""),
    queryFn: () => fetchTraderProfile(targetAddress!),
    enabled: Boolean(targetAddress),
    staleTime: 30_000,
  });

  const profile = useMemo((): TraderProfile | null => {
    const payload = profileQuery.data;
    if (!payload || !targetAddress) return null;

    const alias =
      payload.displayName?.trim() ||
      `Trader ${payload.address.slice(0, 6)}`;

    const exposures = payload.positions.map((position) => ({
      marketSlug: position.marketSlug,
      marketTitle: position.marketTitle,
      category: "Market",
      notionalUsd: position.amountUsd,
      side: position.side,
      markProb: position.oddsPct / 100,
    }));

    const trades = payload.trades.map(toProfileTrade);

    return {
      address: payload.address,
      alias,
      joinedAt: payload.joinedAt ?? new Date().toISOString(),
      rank: payload.rank,
      followers: 0,
      following: 0,
      activeMarkets: payload.stats.openPositions,
      stats: {
        pnlUsd: payload.stats.totalPnlUsd,
        volumeUsd: payload.stats.totalVolumeUsd,
        winRatePct: payload.stats.winRatePct,
        trades: trades.length,
        roiPct:
          payload.stats.totalVolumeUsd > 0
            ? (payload.stats.totalPnlUsd / payload.stats.totalVolumeUsd) * 100
            : 0,
        bestTradeUsd: 0,
        avgTicketUsd:
          trades.length > 0
            ? payload.stats.totalVolumeUsd / trades.length
            : 0,
        streak: 0,
        delta24h: 0,
      },
      equity: trades.map((trade, index) => ({
        at: trade.at,
        equity: payload.stats.totalPnlUsd * ((index + 1) / Math.max(trades.length, 1)),
      })),
      exposures,
      categoryMix: [],
      trades,
      positions: payload.positions,
      publicTrades: payload.trades,
      tradesNextCursor: payload.tradesNextCursor,
    };
  }, [profileQuery.data, targetAddress]);

  return {
    profile,
    isMine,
    targetAddress,
    isLoading: profileQuery.isLoading,
    isError: profileQuery.isError,
    refetch: profileQuery.refetch,
  };
}
