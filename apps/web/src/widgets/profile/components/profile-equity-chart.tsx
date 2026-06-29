"use client";

import { motion } from "framer-motion";
import { LineChart, TrendingUp } from "lucide-react";
import { memo, useId, useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";
import { compactUsd, signedPct } from "../lib/format";
import type { EquityPoint, ProfileWindow } from "../lib/types";

const WINDOW_OPTIONS: ReadonlyArray<{ id: ProfileWindow; label: string }> = [
  { id: "24h", label: "24h" },
  { id: "7d", label: "7d" },
  { id: "30d", label: "30d" },
  { id: "90d", label: "90d" },
  { id: "all", label: "All" },
];

export type ProfileEquityChartProps = {
  data: ReadonlyArray<EquityPoint>;
  window: ProfileWindow;
  onWindowChange: (next: ProfileWindow) => void;
};

function ProfileEquityChartInner({
  data,
  window,
  onWindowChange,
}: ProfileEquityChartProps) {
  const gradientId = useId().replace(/[^a-zA-Z0-9-]/g, "");

  const series = useMemo(
    () => data.map((d, i) => ({ ...d, i })),
    [data],
  );

  const summary = useMemo(() => {
    if (series.length < 2) {
      return { startValue: 0, endValue: 0, deltaPct: 0, deltaAbs: 0 };
    }
    const startValue = series[0]!.equity;
    const endValue = series[series.length - 1]!.equity;
    const deltaAbs = endValue - startValue;
    const deltaPct = startValue > 0 ? (deltaAbs / startValue) * 100 : 0;
    return { startValue, endValue, deltaPct, deltaAbs };
  }, [series]);

  const profitable = summary.deltaPct >= 0;
  const stroke = profitable ? "rgb(110,231,183)" : "rgb(251,113,133)";

  const domain = useMemo<[number, number]>(() => {
    if (!series.length) return [0, 1];
    const eq = series.map((d) => d.equity);
    const lo = Math.min(...eq);
    const hi = Math.max(...eq);
    const pad = Math.max((hi - lo) * 0.1, 50);
    return [lo - pad, hi + pad];
  }, [series]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="glass-panel-strong relative overflow-hidden rounded-2xl ring-1 ring-[var(--hub-border)]"
    >
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--hub-border)] px-4 py-3 sm:px-5">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-400/25">
            <LineChart className="h-3.5 w-3.5" />
          </span>
          <div>
            <p className="text-[9.5px] font-bold uppercase tracking-[0.2em] text-[var(--hub-muted)]">
              Performance
            </p>
            <h2 className="text-[14px] font-semibold tracking-tight text-[var(--hub-fg)]">
              Equity curve
            </h2>
            <p className="mt-1 flex flex-wrap items-baseline gap-2 text-[11px] text-[var(--hub-muted)]">
              <span className="font-mono text-[15px] font-semibold tabular-nums text-[var(--hub-fg)]">
                {compactUsd(summary.endValue)}
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[10px] font-bold ring-1",
                  profitable
                    ? "bg-emerald-500/10 text-emerald-200 ring-emerald-400/25"
                    : "bg-rose-500/10 text-rose-200 ring-rose-400/25",
                )}
              >
                <TrendingUp className="h-2.5 w-2.5" />
                {signedPct(summary.deltaPct, 2)}
              </span>
              <span className="font-mono text-[var(--hub-muted)]">
                ({summary.deltaAbs >= 0 ? "+" : "−"}
                {compactUsd(Math.abs(summary.deltaAbs))})
              </span>
            </p>
          </div>
        </div>
        <WindowTabs value={window} onChange={onWindowChange} />
      </header>

      <div className="px-1 pb-2 pt-3">
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={series} margin={{ top: 4, right: 12, left: 4, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={stroke} stopOpacity={0.4} />
                <stop offset="100%" stopColor={stroke} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 6" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="i" hide />
            <YAxis
              domain={domain}
              tick={{ fill: "#71717a", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={48}
              tickFormatter={(v) => compactUsd(Number(v))}
            />
            <Tooltip
              cursor={{ stroke: "rgba(255,255,255,0.08)" }}
              contentStyle={{
                background: "rgba(10,10,14,0.96)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "10px",
                fontSize: "12px",
              }}
              labelFormatter={(_, payload) => {
                const p = payload?.[0]?.payload as { at?: string } | undefined;
                return p?.at ? new Date(p.at).toLocaleString() : "";
              }}
              formatter={(value) => [
                `$${Number(value ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
                "Equity",
              ]}
            />
            <Area
              type="monotone"
              dataKey="equity"
              stroke={stroke}
              strokeWidth={1.6}
              fill={`url(#${gradientId})`}
              dot={false}
              activeDot={{ r: 3, fill: stroke }}
              isAnimationActive={series.length < 100}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.section>
  );
}

function WindowTabs({
  value,
  onChange,
}: {
  value: ProfileWindow;
  onChange: (next: ProfileWindow) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Time window"
      className="inline-flex rounded-lg bg-[var(--hub-bg-subtle)] p-1 ring-1 ring-[var(--hub-border)]"
    >
      {WINDOW_OPTIONS.map((opt) => {
        const isActive = opt.id === value;
        return (
          <button
            key={opt.id}
            role="tab"
            type="button"
            aria-selected={isActive}
            onClick={() => onChange(opt.id)}
            className={cn(
              "rounded-md px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wider transition",
              isActive
                ? "bg-[var(--hub-card-hover)] text-[var(--hub-fg)] shadow-inner shadow-cyan-500/10 ring-1 ring-cyan-400/30"
                : "text-[var(--hub-muted)] hover:text-[var(--hub-muted)]",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export const ProfileEquityChart = memo(ProfileEquityChartInner);
