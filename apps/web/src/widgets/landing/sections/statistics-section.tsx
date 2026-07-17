"use client";

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { motion } from "framer-motion";
import { useHydrationSafeReducedMotion } from "@/lib/use-hydration-safe-reduced-motion";
import { BarChart3 } from "lucide-react";
import { SectionShell } from "../components/section-shell";

const volumeSeries = [
  { d: "Mon", v: 28 },
  { d: "Tue", v: 34 },
  { d: "Wed", v: 31 },
  { d: "Thu", v: 42 },
  { d: "Fri", v: 39 },
  { d: "Sat", v: 48 },
  { d: "Sun", v: 52 },
];

const tiles = [
  { label: "Median spread", value: "6 bps", sub: "Top decile books" },
  { label: "Fill rate", value: "99.2%", sub: "Last 24h internal" },
  { label: "Markets resolved", value: "842", sub: "Rolling 30d" },
  { label: "Unique makers", value: "18.4k", sub: "Verified desks" },
];

export function StatisticsSection() {
  const reduceMotion = useHydrationSafeReducedMotion();

  return (
    <SectionShell
      id="statistics"
      eyebrow="Surveillance"
      title="Platform statistics"
      description="Risk-facing aggregates at a glance. Wire to warehouse metrics for production dashboards."
      action={
        <span className="rounded-full bg-white/5 px-3 py-1 text-[11px] text-zinc-400 ring-1 ring-white/10">
          <BarChart3 className="-mt-0.5 mr-1 inline h-3.5 w-3.5 text-cyan-400/80" />
          Demo metrics
        </span>
      }
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-panel-strong neon-edge-cyan lg:col-span-2 rounded-2xl p-4 sm:p-5"
        >
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                Notional velocity
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-white">
                $41.2M
                <span className="ml-2 text-sm font-normal text-emerald-400/90">+12.4%</span>
              </p>
            </div>
            <div className="text-right text-[11px] text-zinc-600">
              Indexed units · 7d
            </div>
          </div>
          <div className="mt-4 h-[220px] w-full">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={volumeSeries} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgb(34,211,238)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="rgb(34,211,238)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="d"
                  tick={{ fill: "#71717a", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#52525b", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={28}
                />
                <Tooltip
                  contentStyle={{
                    background: "rgba(12,12,14,0.92)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "10px",
                    fontSize: "12px",
                  }}
                  labelStyle={{ color: "#a1a1aa" }}
                />
                <Area
                  type="monotone"
                  dataKey="v"
                  stroke="rgb(34,211,238)"
                  strokeWidth={2}
                  fill="url(#volGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          {tiles.map((t, i) => (
            <motion.div
              key={t.label}
              initial={reduceMotion ? false : { opacity: 0, x: 8 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="glass-panel rounded-xl px-4 py-3.5"
            >
              <p className="text-[11px] uppercase tracking-wide text-zinc-500">{t.label}</p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-white">{t.value}</p>
              <p className="mt-0.5 text-[11px] text-zinc-600">{t.sub}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}
