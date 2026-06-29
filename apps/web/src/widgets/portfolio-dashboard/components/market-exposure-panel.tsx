"use client";

import type { ExposureSlice } from "../lib/portfolio-metrics";
import { formatCompactUsd } from "@orakly/utils";
import { motion } from "framer-motion";
import { Layers } from "lucide-react";
import Link from "next/link";
import { memo, useMemo } from "react";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";

const BAR_COLORS = [
  "rgb(34,211,238)",
  "rgb(167,139,250)",
  "rgb(52,211,153)",
  "rgb(251,113,133)",
  "rgb(251,191,36)",
  "rgb(56,189,248)",
  "rgb(244,114,182)",
  "rgb(132,204,22)",
];

function categoryRollup(slices: ExposureSlice[], equityUsd: number) {
  const m = new Map<string, number>();
  for (const s of slices) {
    m.set(s.category, (m.get(s.category) ?? 0) + s.notionalUsd);
  }
  const denom = Math.max(equityUsd, 1e-9);
  return Array.from(m.entries())
    .map(([name, notionalUsd]) => ({
      name,
      notionalUsd,
      pct: (notionalUsd / denom) * 100,
    }))
    .sort((a, b) => b.notionalUsd - a.notionalUsd);
}

function MarketExposurePanelInner({
  slices,
  equityUsd,
  chartHeight = 200,
}: {
  slices: ExposureSlice[];
  equityUsd: number;
  chartHeight?: number;
}) {
  const barData = useMemo(() => {
    return slices.slice(0, 10).map((s) => ({
      key: `${s.marketId}-${s.side}`,
      label:
        s.title.length > 28 ? `${s.title.slice(0, 26)}…` : s.title,
      fullTitle: s.title,
      pct: s.pctOfEquity,
      notionalUsd: s.notionalUsd,
      side: s.side,
      slug: s.slug,
    }));
  }, [slices]);

  const categories = useMemo(
    () => categoryRollup(slices, equityUsd),
    [slices, equityUsd],
  );

  if (!slices.length) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
        className="surface-terminal-solid rounded-md px-r24 py-s40 text-center"
      >
        <Layers className="mx-auto h-7 w-7 text-[var(--hub-muted)]" />
        <p className="mt-r16 font-mono text-[11px] font-medium text-[var(--hub-muted)]">No book concentration</p>
        <p className="mt-r8 font-mono text-[10px] text-[var(--hub-muted)]">Exposure builds from open legs</p>
      </motion.div>
    );
  }

  return (
    <div className="surface-terminal-solid overflow-hidden rounded-md">
      <div className="border-b border-[var(--hub-border)] px-r16 py-r16 sm:px-r20">
        <p className="label-terminal">Risk rail</p>
        <p className="mt-r4 font-mono text-[11px] font-medium tabular-nums text-[var(--hub-fg)]">
          Exposure vs equity
        </p>
        <p className="mt-r8 font-mono text-[10px] tabular-nums text-[var(--hub-muted)]">
          Share % · marked notional per leg
        </p>
      </div>

      <div className="w-full px-2 pb-1 pt-1.5" style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart
            data={barData}
            layout="vertical"
            margin={{ top: 4, right: 8, left: 4, bottom: 4 }}
            barCategoryGap={6}
          >
            <XAxis type="number" domain={[0, "dataMax"]} hide />
            <YAxis
              type="category"
              dataKey="label"
              width={108}
              tick={{ fill: "#a1a1aa", fontSize: 9 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.03)" }}
              contentStyle={{
                background: "rgba(10,10,14,0.96)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "10px",
                fontSize: "11px",
              }}
              formatter={(v) =>
                [`${Number(v ?? 0).toFixed(1)}%`, "Share"] as [string, string]
              }
              labelFormatter={(_, payload) => {
                const p = payload?.[0]?.payload as { fullTitle?: string; side?: string } | undefined;
                return p?.fullTitle ? `${p.fullTitle} · ${p.side}` : "";
              }}
            />
            <Bar dataKey="pct" radius={[0, 4, 4, 0]} maxBarSize={14}>
              {barData.map((row, i) => (
                <Cell key={row.key} fill={BAR_COLORS[i % BAR_COLORS.length]!} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <ul className="max-h-[120px] divide-y divide-white/[0.05] overflow-y-auto overscroll-contain border-t border-[var(--hub-border)]">
        {slices.slice(0, 12).map((s, i) => (
          <li key={`${s.marketId}-${s.side}`} className="flex items-center gap-2 px-4 py-1.5 text-[11px] sm:px-5">
            <span
              className="h-2 w-2 shrink-0 rounded-sm"
              style={{ backgroundColor: BAR_COLORS[i % BAR_COLORS.length] }}
              aria-hidden
            />
            <Link
              href={`/markets/${s.slug}`}
              className="min-w-0 flex-1 truncate font-medium text-[var(--hub-muted)] hover:text-[var(--hub-primary-bright)]"
            >
              {s.title}
            </Link>
            <span
              className={cn(
                "shrink-0 rounded px-1 py-px font-mono text-[9px] font-bold ring-1",
                s.side === "YES"
                  ? "bg-cyan-500/15 text-cyan-200 ring-cyan-500/25"
                  : "bg-[var(--hub-primary-soft)] text-violet-200 ring-violet-500/25",
              )}
            >
              {s.side}
            </span>
            <span className="shrink-0 font-mono tabular-nums text-[var(--hub-muted)]">
              {s.pctOfEquity.toFixed(1)}%
            </span>
            <span className="hidden shrink-0 font-mono text-[10px] tabular-nums text-[var(--hub-muted)] sm:inline">
              {formatCompactUsd(s.notionalUsd)}
            </span>
          </li>
        ))}
      </ul>

      {categories.length > 1 ? (
        <div className="border-t border-white/6 px-4 py-3 sm:px-5">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--hub-muted)]">
            Category mix
          </p>
          <div className="flex flex-wrap gap-1.5">
            {categories.map((c, i) => (
              <span
                key={c.name}
                className="inline-flex items-center gap-1 rounded-md bg-[var(--hub-bg-subtle)] px-2 py-1 font-mono text-[10px] ring-1 ring-[var(--hub-border)]"
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: BAR_COLORS[i % BAR_COLORS.length] }}
                  aria-hidden
                />
                <span className="text-[var(--hub-muted)]">{c.name}</span>
                <span className="tabular-nums text-[var(--hub-fg)]">{c.pct.toFixed(0)}%</span>
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export const MarketExposurePanel = memo(MarketExposurePanelInner);
