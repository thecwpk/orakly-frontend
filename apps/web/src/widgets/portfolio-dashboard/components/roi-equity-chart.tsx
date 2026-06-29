"use client";

import type { EquityPoint, EquityRoiPoint } from "../lib/portfolio-metrics";
import { attachRoiPercent } from "../lib/portfolio-metrics";
import { memo, useMemo } from "react";
import {
  Area,
  ComposedChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function RoiEquityChartInner({
  data,
  chartHeight = 260,
}: {
  data: EquityPoint[];
  /** Compact terminal layouts (~132–160px) avoid dominating the page. */
  chartHeight?: number;
}) {
  const chartData = useMemo<EquityRoiPoint[]>(() => {
    const withRoi = attachRoiPercent(data);
    return withRoi.map((d, i) => ({ ...d, i }));
  }, [data]);

  const { domainEquity, domainRoi } = useMemo(() => {
    if (!chartData.length) {
      return { domainEquity: [0, 1] as [number, number], domainRoi: [0, 0] as [number, number] };
    }
    const eq = chartData.map((d) => d.equity);
    const roi = chartData.map((d) => d.roiPct);
    const minE = Math.min(...eq);
    const maxE = Math.max(...eq);
    const padE = Math.max((maxE - minE) * 0.08, 1);
    const minR = Math.min(...roi);
    const maxR = Math.max(...roi);
    const padR = Math.max((maxR - minR) * 0.15, 0.5);
    return {
      domainEquity: [minE - padE, maxE + padE] as [number, number],
      domainRoi: [minR - padR, maxR + padR] as [number, number],
    };
  }, [chartData]);

  return (
    <div className="overflow-hidden rounded-lg border border-white/[0.07] bg-[#07070d]/95 ring-1 ring-emerald-500/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="border-b border-[var(--hub-border)] px-3 py-2 sm:px-3.5">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--hub-muted)]">
              Performance
            </p>
            <p className="text-[12px] font-medium text-[var(--hub-fg)]">Equity &amp; ROI</p>
          </div>
          <div className="flex gap-3 font-mono text-[10px] text-[var(--hub-muted)]">
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden />
              Equity USD
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-violet-400" aria-hidden />
              ROI %
            </span>
          </div>
        </div>
        <p className="mt-1 text-[10px] leading-snug text-[var(--hub-muted)]">
          ROI is return vs first point on this curve; anchored from fills. Not tax advice.
        </p>
      </div>
      <div className="w-full px-1 pb-1.5 pt-1" style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height={chartHeight}>
          <ComposedChart data={chartData} margin={{ top: 6, right: 12, left: 4, bottom: 0 }}>
            <defs>
              <linearGradient id="portfolioEqFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(52,211,153)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="rgb(52,211,153)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 6" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="i" hide />
            <YAxis
              yAxisId="eq"
              domain={domainEquity}
              tick={{ fill: "#71717a", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={48}
              tickFormatter={(v) =>
                `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v >= 1 ? v.toFixed(0) : v.toFixed(2)}`
              }
            />
            <YAxis
              yAxisId="roi"
              orientation="right"
              domain={domainRoi}
              tick={{ fill: "#a78bfa", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={40}
              tickFormatter={(v) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`}
            />
            <Tooltip
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
              formatter={(value, name) => {
                if (name === "Equity")
                  return [`$${Number(value ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, "Equity"];
                return [`${Number(value ?? 0).toFixed(2)}%`, "ROI"];
              }}
            />
            <Area
              yAxisId="eq"
              type="monotone"
              dataKey="equity"
              name="Equity"
              stroke="rgb(52,211,153)"
              strokeWidth={1.5}
              fill="url(#portfolioEqFill)"
              dot={false}
              activeDot={{ r: 3, fill: "rgb(52,211,153)" }}
              isAnimationActive={chartData.length < 80}
            />
            <Line
              yAxisId="roi"
              type="monotone"
              dataKey="roiPct"
              name="ROI"
              stroke="rgb(167,139,250)"
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 3, fill: "rgb(167,139,250)" }}
              isAnimationActive={chartData.length < 80}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export const RoiEquityChart = memo(RoiEquityChartInner);
