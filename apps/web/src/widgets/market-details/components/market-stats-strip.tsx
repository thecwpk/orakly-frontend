"use client";

import type { Market } from "@orakly/types";
import { formatCompactUsd } from "@orakly/utils";
import { memo, useMemo } from "react";
import type { MarketOddsDto } from "@/shared/api/fetchers/markets-live";
import type { MarketRealtimeSnapshot } from "@/websocket/store/market-realtime-store";

export function parseMarketUsdField(s: string | undefined): number | null {
  if (s == null || s === "") return null;
  const n = Number.parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

/** Dense stats rows for strip + trading desk (same numbers). */
export function buildMarketDetailStatCells(
  market: Market,
  odds: MarketOddsDto | undefined,
  rt: MarketRealtimeSnapshot,
): readonly { label: string; value: string; mono?: boolean }[] {
  const liq =
    parseMarketUsdField(rt.odds?.liquidityUsd) ??
    parseMarketUsdField(odds?.liquidityUsd) ??
    market.liquidityUsd;
  const coll =
    parseMarketUsdField(rt.odds?.collateralPoolUsd) ??
    parseMarketUsdField(odds?.collateralPoolUsd);
  const v24 =
    parseMarketUsdField(rt.odds?.volume24hUsd) ??
    parseMarketUsdField(odds?.volume24hUsd) ??
    market.volumeUsd * 0.08;
  const vTot =
    parseMarketUsdField(rt.odds?.volumeTotalUsd) ??
    parseMarketUsdField(odds?.volumeTotalUsd) ??
    market.volumeUsd;
  const feeBps = odds?.takerFeeBps ?? 25;
  return [
    { label: "Liquidity", value: formatCompactUsd(liq), mono: true },
    {
      label: "Collateral",
      value: coll != null ? formatCompactUsd(coll) : "—",
      mono: true,
    },
    { label: "24h volume", value: formatCompactUsd(v24), mono: true },
    { label: "Total vol", value: formatCompactUsd(vTot), mono: true },
    { label: "Taker fee", value: `${feeBps} bps`, mono: true },
  ] as const;
}

function StatCell({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="min-w-[100px] flex-1 rounded-xl bg-black/25 px-3 py-2.5 ring-1 ring-white/6">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{label}</p>
      <p className={`mt-1 text-sm font-medium text-zinc-100 ${mono ? "font-mono tabular-nums" : ""}`}>
        {value}
      </p>
    </div>
  );
}

function MarketStatsStripInner({
  market,
  odds,
  rt,
}: {
  market: Market;
  odds: MarketOddsDto | undefined;
  rt: MarketRealtimeSnapshot;
}) {
  const cells = useMemo(
    () => [...buildMarketDetailStatCells(market, odds, rt)],
    [market, odds, rt],
  );

  return (
    <div className="flex flex-wrap gap-2 sm:gap-3">
      {cells.map((c) => (
        <StatCell key={c.label} label={c.label} value={c.value} mono={c.mono} />
      ))}
    </div>
  );
}

export const MarketStatsStrip = memo(MarketStatsStripInner);
