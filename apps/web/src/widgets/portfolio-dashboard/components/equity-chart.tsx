"use client";

import type { EquityPoint } from "../lib/portfolio-metrics";
import { memo, useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function EquityChartInner({ data }: { data: EquityPoint[] }) {
  const chartData = useMemo(
    () =>
      data.map((d, i) => ({
        ...d,
        i,
      })),
    [data],
  );

  const domainMin = useMemo(() => {
    if (!chartData.length) return 0;
    const vals = chartData.map((d) => d.equity);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const pad = Math.max((max - min) * 0.08, 1);
    return min - pad;
  }, [chartData]);

  const domainMax = useMemo(() => {
    if (!chartData.length) return 1;
    const vals = chartData.map((d) => d.equity);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const pad = Math.max((max - min) * 0.08, 1);
    return max + pad;
  }, [chartData]);

  return (
    <div className="glass-panel-strong overflow-hidden rounded-2xl">
      <div className="border-b border-white/6 px-4 py-3 sm:px-5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--hub-muted)]">Performance</p>
        <p className="text-sm font-medium text-[var(--hub-fg)]">Equity curve (anchored)</p>
        <p className="mt-1 text-[11px] leading-snug text-[var(--hub-muted)]">
          Path implied from your fills; terminal point matches live equity. Not tax or brokerage advice.
        </p>
      </div>
      <div className="h-[240px] w-full px-1 pb-2 pt-3">
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={chartData} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
            <defs>
              <linearGradient id="eqFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(52,211,153)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="rgb(52,211,153)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 6" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="i" tick={{ fill: "#52525b", fontSize: 10 }} axisLine={false} tickLine={false} hide />
            <YAxis
              domain={[domainMin, domainMax]}
              tick={{ fill: "#52525b", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={44}
              tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toFixed(0)}`}
            />
            <Tooltip
              contentStyle={{
                background: "rgba(10,10,12,0.94)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "10px",
                fontSize: "12px",
              }}
              labelFormatter={(_, payload) => {
                const p = payload?.[0]?.payload as { at?: string } | undefined;
                return p?.at ? new Date(p.at).toLocaleString() : "";
              }}
              formatter={(value) => [`$${Number(value ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, "Equity"]}
            />
            <Area
              type="monotone"
              dataKey="equity"
              stroke="rgb(52,211,153)"
              strokeWidth={2}
              fill="url(#eqFill)"
              dot={false}
              activeDot={{ r: 3 }}
              isAnimationActive={chartData.length < 80}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export const EquityChart = memo(EquityChartInner);
