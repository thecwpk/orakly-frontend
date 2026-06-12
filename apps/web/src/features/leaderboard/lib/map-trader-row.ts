import type { TraderLeaderboardRowDto } from "@/shared/api/fetchers/leaderboard";
import type { Trader } from "./types";

export function mapLeaderboardRow(row: TraderLeaderboardRowDto, rank: number): Trader {
  const pnl = Number.parseFloat(row.pnlUsd) || 0;
  const volume = Number.parseFloat(row.totalVolumeUsd) || 0;
  const capital = Math.max(volume * 0.25, 1);
  const roiPct = capital > 0 ? (pnl / capital) * 100 : 0;

  return {
    address: row.walletAddress ?? row.userId,
    alias: row.displayName ?? `Trader ${rank}`,
    pnlUsd: pnl,
    volumeUsd: volume,
    winRatePct: row.winRatePct,
    roiPct,
    trades: row.resolvedMarkets,
    delta24h: 0,
    streak: 0,
    spark: [Math.max(0, 50 + roiPct * 0.1)],
  };
}

export function summarizeTraderRows(rows: Trader[]) {
  if (rows.length === 0) {
    return {
      totalVolumeUsd: 0,
      totalPnlUsd: 0,
      averageWinRate: 0,
      totalTrades: 0,
    };
  }

  let totalVolumeUsd = 0;
  let totalPnlUsd = 0;
  let winSum = 0;
  let totalTrades = 0;

  for (const r of rows) {
    totalVolumeUsd += r.volumeUsd;
    totalPnlUsd += r.pnlUsd;
    winSum += r.winRatePct;
    totalTrades += r.trades;
  }

  return {
    totalVolumeUsd,
    totalPnlUsd,
    averageWinRate: winSum / rows.length,
    totalTrades,
  };
}
