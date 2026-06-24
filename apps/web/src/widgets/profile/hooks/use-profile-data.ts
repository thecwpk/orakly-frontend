"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchTraderLeaderboard } from "@/shared/api/fetchers/leaderboard";
import { fetchPortfolio } from "@/shared/api/fetchers/portfolio";
import { fetchTradesPage } from "@/shared/api/fetchers/trades";
import { useAuthStore } from "@/state/stores/auth.store";
import {
  computeEquityUsd,
  computeMarketExposure,
  computeUnrealizedPnlUsd,
} from "@/widgets/portfolio-dashboard/lib/portfolio-metrics";
import type { EquityPoint, ProfileTrade, TraderProfile } from "../lib/types";

export function useProfileData(address?: string) {
  const tradingUserId = useAuthStore((s) => s.tradingUserId);
  const isMine = !address;
  const actorId = isMine ? tradingUserId : undefined;

  const portfolioQ = useQuery({
    queryKey: ["profile", "portfolio", actorId ?? address],
    queryFn: () => fetchPortfolio(actorId ?? undefined),
    enabled: isMine && !!actorId,
  });

  const tradesQ = useQuery({
    queryKey: ["profile", "trades", actorId ?? address],
    queryFn: () => fetchTradesPage({ take: 100 }),
    enabled: isMine && !!actorId,
  });

  const leaderboardQ = useQuery({
    queryKey: ["profile", "leaderboard", address ?? actorId],
    queryFn: () => fetchTraderLeaderboard({ window: "all", take: 200 }),
  });

  const profile = useMemo((): TraderProfile | null => {
    if (isMine && !actorId) return null;

    const lb = leaderboardQ.data ?? [];
    const row =
      address
        ? lb.find(
            (r) =>
              r.walletAddress?.toLowerCase() === address.toLowerCase() ||
              r.userId === address,
          )
        : actorId
          ? lb.find((r) => r.userId === actorId)
          : undefined;

    const snap = portfolioQ.data;
    const trades = tradesQ.data?.trades ?? [];

    const displayAddress =
      address ?? row?.walletAddress ?? actorId ?? "0x0000000000000000000000000000000000000000";
    const alias = row?.displayName ?? `Trader ${displayAddress.slice(0, 6)}`;

    const equity = snap ? computeEquityUsd(snap) : 0;
    const unrealized = snap ? computeUnrealizedPnlUsd(snap) : 0;
    const realized = snap ? Number.parseFloat(snap.realizedPnlUsd) || 0 : 0;
    const volumeUsd = row ? Number.parseFloat(row.totalVolumeUsd) || 0 : 0;

    const nowIso = new Date().toISOString();
    const equitySeries: EquityPoint[] =
      equity > 0
        ? [
            { equity: equity * 0.92, at: nowIso },
            { equity, at: nowIso },
          ]
        : [{ equity: 0, at: nowIso }];

    const exposures = snap
      ? computeMarketExposure(snap, equity).map((e) => ({
          marketSlug: e.slug,
          marketTitle: e.title,
          category: e.category,
          notionalUsd: e.notionalUsd,
          side: e.side,
          markProb: e.side === "YES" ? 0.5 : 0.5,
        }))
      : [];

    const profileTrades: ProfileTrade[] = trades.slice(0, 20).map((t) => ({
      id: t.id,
      marketSlug: t.marketId,
      marketTitle: t.marketId,
      marketCategory: "Market",
      side: t.outcome,
      action: t.side,
      sizeUsd: Number.parseFloat(t.notionalUsd) || 0,
      pnlUsd: 0,
      at: t.executedAt,
    }));

    const tradeCount = row?.resolvedMarkets ?? trades.length;
    const avgTicket =
      tradeCount > 0 ? volumeUsd / Math.max(tradeCount, 1) : 0;

    return {
      address: displayAddress,
      alias,
      joinedAt: new Date().toISOString(),
      rank: row ? lb.indexOf(row) + 1 : lb.length + 1,
      followers: 0,
      following: 0,
      activeMarkets: snap?.positions.length ?? 0,
      stats: {
        pnlUsd: realized + unrealized,
        volumeUsd,
        winRatePct: row?.winRatePct ?? 0,
        trades: tradeCount,
        roiPct: equity > 0 ? ((realized + unrealized) / equity) * 100 : 0,
        bestTradeUsd: 0,
        avgTicketUsd: avgTicket,
        streak: 0,
        delta24h: 0,
      },
      equity: equitySeries,
      exposures,
      categoryMix: [],
      trades: profileTrades,
    };
  }, [
    address,
    actorId,
    isMine,
    leaderboardQ.data,
    portfolioQ.data,
    tradesQ.data,
  ]);

  return {
    profile,
    isLoading:
      isMine && !actorId
        ? false
        : leaderboardQ.isLoading ||
          (isMine && (portfolioQ.isLoading || tradesQ.isLoading)),
    isError: portfolioQ.isError || leaderboardQ.isError,
  };
}
