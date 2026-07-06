"use client";

import { memo, useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";
import { compactUsd } from "../lib/format";
import type { ProfilePnlWindow } from "@/shared/contracts/trader-profile";
import type { ProfileTrade } from "../lib/types";

const WINDOW_OPTIONS: ReadonlyArray<{ id: ProfilePnlWindow; label: string }> = [
  { id: "7d", label: "7d" },
  { id: "30d", label: "30d" },
  { id: "all", label: "All time" },
];

function windowStart(window: ProfilePnlWindow): number | null {
  if (window === "all") return null;
  const days = window === "7d" ? 7 : 30;
  return Date.now() - days * 24 * 60 * 60 * 1000;
}

function buildCumulativePnlSeries(
  trades: ReadonlyArray<Pick<ProfileTrade, "at" | "sizeUsd" | "action">>,
  window: ProfilePnlWindow,
): Array<{ at: string; pnl: number; index: number }> {
  const startMs = windowStart(window);
  const sorted = [...trades]
    .filter((trade) => {
      if (!startMs) return true;
      return new Date(trade.at).getTime() >= startMs;
    })
    .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

  if (sorted.length === 0) {
    const now = new Date().toISOString();
    return [
      { at: now, pnl: 0, index: 0 },
      { at: now, pnl: 0, index: 1 },
    ];
  }

  let cumulative = 0;
  const points: Array<{ at: string; pnl: number; index: number }> = [
    { at: sorted[0]!.at, pnl: 0, index: 0 },
  ];

  sorted.forEach((trade, index) => {
    const signed = trade.action === "SELL" ? trade.sizeUsd : -trade.sizeUsd;
    cumulative += signed;
    points.push({
      at: trade.at,
      pnl: cumulative,
      index: index + 1,
    });
  });

  return points;
}

export type ProfilePnlChartProps = {
  trades: ReadonlyArray<ProfileTrade>;
  currentPnlUsd: number;
};

function ProfilePnlChartInner({ trades, currentPnlUsd }: ProfilePnlChartProps) {
  const [window, setWindow] = useState<ProfilePnlWindow>("30d");

  const series = useMemo(
    () => buildCumulativePnlSeries(trades, window),
    [trades, window],
  );

  const endPnl = series[series.length - 1]?.pnl ?? currentPnlUsd;
  const profitable = endPnl >= 0;
  const stroke = profitable ? "#22c55e" : "#ef4444";

  const domain = useMemo<[number, number]>(() => {
    const values = series.map((point) => point.pnl);
    const min = Math.min(...values, 0);
    const max = Math.max(...values, 0);
    const pad = Math.max((max - min) * 0.12, 10);
    return [min - pad, max + pad];
  }, [series]);

  return (
    <section className="glass-panel-strong overflow-hidden rounded-2xl ring-1 ring-[var(--hub-border)]">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--hub-border)] px-4 py-3 sm:px-5">
        <div>
          <p className="text-[9.5px] font-bold uppercase tracking-[0.2em] text-[var(--hub-muted)]">
            Performance
          </p>
          <h2 className="text-[14px] font-semibold tracking-tight text-[var(--hub-fg)]">
            Cumulative PnL
          </h2>
        </div>
        <div className="inline-flex rounded-lg bg-[var(--hub-bg-subtle)] p-1 ring-1 ring-[var(--hub-border)]">
          {WINDOW_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setWindow(option.id)}
              className={cn(
                "rounded-md px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wider transition",
                window === option.id
                  ? "bg-[var(--hub-card-hover)] text-[var(--hub-fg)] ring-1 ring-[var(--hub-border)]"
                  : "text-[var(--hub-muted)] hover:text-[var(--hub-fg)]",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </header>

      <div className="h-[240px] w-full px-1 pb-2 pt-3">
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={series} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 6" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="index" hide />
            <YAxis
              domain={domain}
              tick={{ fill: "#71717a", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={48}
              tickFormatter={(value) => compactUsd(Number(value))}
            />
            <Tooltip
              contentStyle={{
                background: "rgba(10,10,14,0.96)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "10px",
                fontSize: "12px",
              }}
              labelFormatter={(_, payload) => {
                const row = payload?.[0]?.payload as { at?: string } | undefined;
                return row?.at ? new Date(row.at).toLocaleString() : "";
              }}
              formatter={(value) => [compactUsd(Number(value ?? 0)), "PnL"]}
            />
            <Line
              type="monotone"
              dataKey="pnl"
              stroke={stroke}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3, fill: stroke }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

export const ProfilePnlChart = memo(ProfilePnlChartInner);
