"use client";

import { formatCompactUsd } from "@orakly/utils";
import { ArrowDownRight, ArrowUpRight, BarChart3 } from "lucide-react";
import { memo, useMemo } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MarketRealtimeSnapshot } from "@/websocket/store/market-realtime-store";
import { cn } from "@/lib/utils";
import { buildVolumeWindow } from "../lib/volume-history";

function MarketVolumeChartInner({
  slug,
  totalVolumeUsd,
  marketId,
  rt,
  className,
}: {
  slug: string;
  marketId: string | null;
  totalVolumeUsd: number;
  rt: MarketRealtimeSnapshot;
  className?: string;
}) {
  const win = useMemo(
    () =>
      buildVolumeWindow({
        slug,
        marketId,
        totalVolumeUsd,
        trades: rt.tradesRecent,
      }),
    [slug, marketId, totalVolumeUsd, rt.tradesRecent],
  );

  const rows = useMemo(
    () =>
      win.buckets.map((b) => ({
        label: b.label,
        buy: Math.round(b.buyUsd),
        sell: Math.round(b.sellUsd),
        cumulative: Math.round(b.cumulativeUsd),
      })),
    [win.buckets],
  );

  const buyPct = win.totalUsd > 0 ? (win.buyUsd / win.totalUsd) * 100 : 50;
  const sellPct = 100 - buyPct;
  const imbalanceLabel = `${(win.imbalance * 100).toFixed(0)}%`;
  const imbalancePositive = win.imbalance >= 0;

  return (
    <div
      className={cn(
        "glass-panel-strong neon-edge-violet flex flex-col overflow-hidden rounded-2xl",
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/[0.06] px-4 py-3">
        <div>
          <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            <BarChart3 className="h-3 w-3" />
            Volume · 24h
          </p>
          <p className="text-sm font-medium text-white">
            {formatCompactUsd(win.totalUsd)}{" "}
            <span className="text-[12px] text-zinc-500">notional</span>
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[10.5px] tabular-nums text-emerald-300 ring-1 ring-emerald-500/25">
            <ArrowUpRight className="h-2.5 w-2.5" />
            {formatCompactUsd(win.buyUsd)}
          </span>
          <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/10 px-1.5 py-0.5 font-mono text-[10.5px] tabular-nums text-rose-300 ring-1 ring-rose-500/25">
            <ArrowDownRight className="h-2.5 w-2.5" />
            {formatCompactUsd(win.sellUsd)}
          </span>
          <span
            className={cn(
              "rounded-md px-1.5 py-0.5 font-mono text-[10.5px] ring-1",
              imbalancePositive
                ? "bg-emerald-500/12 text-emerald-300 ring-emerald-500/25"
                : "bg-rose-500/12 text-rose-300 ring-rose-500/25",
            )}
            title="Net buy/sell imbalance"
          >
            Δ {imbalanceLabel}
          </span>
        </div>
      </div>

      {/* buy/sell ratio bar */}
      <div className="px-4 pt-3">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-zinc-500">
          <span>Buy</span>
          <span>Sell</span>
        </div>
        <div
          className="mt-1 h-1.5 overflow-hidden rounded-full bg-rose-500/30 ring-1 ring-white/[0.04]"
          aria-label="Buy vs sell ratio"
        >
          <div
            className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400"
            style={{ width: `${buyPct}%` }}
          />
        </div>
        <div className="mt-1 flex items-center justify-between font-mono text-[10px] tabular-nums text-zinc-500">
          <span>{buyPct.toFixed(0)}%</span>
          <span>{sellPct.toFixed(0)}%</span>
        </div>
      </div>

      <div className="h-[220px] w-full px-2 pb-2 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={rows}
            margin={{ top: 4, right: 8, left: -10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="volBuy" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(52,211,153)" stopOpacity={0.95} />
                <stop offset="100%" stopColor="rgb(52,211,153)" stopOpacity={0.45} />
              </linearGradient>
              <linearGradient id="volSell" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(251,113,133)" stopOpacity={0.85} />
                <stop offset="100%" stopColor="rgb(251,113,133)" stopOpacity={0.4} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 6" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: "#71717a", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              interval={2}
            />
            <YAxis
              yAxisId="bars"
              tick={{ fill: "#52525b", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={36}
              tickFormatter={(v) => formatCompactUsd(Number(v))}
            />
            <YAxis
              yAxisId="cum"
              orientation="right"
              tick={{ fill: "#52525b", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={36}
              tickFormatter={(v) => formatCompactUsd(Number(v))}
            />
            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.04)" }}
              contentStyle={{
                background: "rgba(10,10,12,0.94)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "10px",
                fontSize: "11.5px",
                padding: "8px 10px",
              }}
              formatter={(value, name) => [
                formatCompactUsd(Number(value ?? 0)),
                name === "buy" ? "Buy" : name === "sell" ? "Sell" : "Cumulative",
              ]}
            />
            <Bar
              yAxisId="bars"
              dataKey="buy"
              stackId="vol"
              fill="url(#volBuy)"
              radius={[2, 2, 0, 0]}
              isAnimationActive={false}
            />
            <Bar
              yAxisId="bars"
              dataKey="sell"
              stackId="vol"
              fill="url(#volSell)"
              radius={[2, 2, 0, 0]}
              isAnimationActive={false}
            />
            <Line
              yAxisId="cum"
              type="monotone"
              dataKey="cumulative"
              stroke="rgb(167,139,250)"
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export const MarketVolumeChart = memo(MarketVolumeChartInner);
