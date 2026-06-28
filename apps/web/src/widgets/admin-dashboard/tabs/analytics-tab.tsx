"use client";

import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Calendar,
  DollarSign,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";
import { compactInt, compactUsd, parseDecimal } from "../lib/format";
import {
  useAdminOverviewQuery,
  useAdminRevenueQuery,
} from "../hooks/use-admin-queries";
import { Section, TabShell } from "../components/tab-shell";
import { StatCard } from "../components/stat-card";
import { EmptyState } from "../components/empty-state";

const RANGE_OPTIONS = [
  { id: 14, label: "14d" },
  { id: 30, label: "30d" },
  { id: 60, label: "60d" },
  { id: 90, label: "90d" },
] as const;

type RangeOption = (typeof RANGE_OPTIONS)[number]["id"];

export function AdminAnalyticsTab() {
  const [days, setDays] = useState<RangeOption>(30);

  const overviewQ = useAdminOverviewQuery(true);
  const revenueQ = useAdminRevenueQuery(days, true);

  const series = useMemo(() => {
    const base = (revenueQ.data?.series ?? []).map((s) => ({
      day: s.day,
      fees: parseDecimal(s.feesUsd),
    }));
    let cum = 0;
    return base.map((p) => {
      cum += p.fees;
      return { ...p, cum };
    });
  }, [revenueQ.data?.series]);

  const totalFees = useMemo(() => series.reduce((a, b) => a + b.fees, 0), [series]);
  const avgFee = series.length > 0 ? totalFees / series.length : 0;
  const maxFee = useMemo(() => series.reduce((m, p) => Math.max(m, p.fees), 0), [series]);
  const peakDay = useMemo(
    () => series.find((p) => p.fees === maxFee)?.day ?? null,
    [series, maxFee],
  );

  const volume7d = parseDecimal(overviewQ.data?.volumeNotional7dUsd);
  const trades7d = overviewQ.data?.trades7d ?? 0;
  // Synthetic but well-defined "implied take rate" — fees / notional.
  const takeRateBps = volume7d > 0 ? (parseDecimal(overviewQ.data?.platformFeesUsd) / volume7d) * 10_000 : 0;

  // Synthesize a 7d daily volume profile from the 7d total + revenue dailies'
  // shape, so the chart is meaningful even before a dedicated /analytics/volume
  // endpoint exists.
  const volumeProfile = useMemo(() => {
    if (!series.length) return [] as { day: string; volume: number; trades: number }[];
    const last7 = series.slice(-7);
    const totalDailyFee = last7.reduce((a, b) => a + b.fees, 0);
    return last7.map((p) => {
      const share = totalDailyFee > 0 ? p.fees / totalDailyFee : 1 / last7.length;
      return {
        day: p.day,
        volume: volume7d * share,
        trades: Math.round(trades7d * share),
      };
    });
  }, [series, volume7d, trades7d]);

  const refresh = () => {
    void overviewQ.refetch();
    void revenueQ.refetch();
  };

  return (
    <TabShell
      eyebrow="Analytics"
      title="Trading & revenue"
      description="Daily fee revenue, cumulative platform take, and 7-day trading volume profile."
      actions={
        <>
          <div className="flex items-center gap-1 rounded-xl bg-[var(--hub-bg-subtle)] p-1 ring-1 ring-[var(--hub-border)]">
            {RANGE_OPTIONS.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setDays(r.id)}
                className={cn(
                  "relative inline-flex items-center rounded-lg px-2 py-1 text-[10.5px] font-bold uppercase tracking-wider transition",
                  days === r.id
                    ? "bg-[var(--hub-card-hover)] text-white"
                    : "text-[var(--hub-muted)] hover:text-[var(--hub-fg)]",
                )}
              >
                {days === r.id ? (
                  <motion.span
                    layoutId="analytics-range-active"
                    className="absolute inset-0 -z-0 rounded-lg ring-1 ring-[var(--hub-border-strong)]"
                    transition={{ type: "spring", stiffness: 460, damping: 32 }}
                  />
                ) : null}
                <span className="relative z-10">{r.label}</span>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={refresh}
            disabled={overviewQ.isFetching || revenueQ.isFetching}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--hub-bg-subtle)] px-2.5 py-1.5 text-[12px] font-medium text-[var(--hub-fg)] ring-1 ring-[var(--hub-border)] transition hover:bg-[var(--hub-card-hover)] disabled:opacity-50"
          >
            <RefreshCw
              className={cn(
                "h-3.5 w-3.5",
                (overviewQ.isFetching || revenueQ.isFetching) && "animate-spin",
              )}
            />
            Refresh
          </button>
        </>
      }
    >
      {revenueQ.isError || overviewQ.isError ? (
        <Section>
          <EmptyState
            icon={AlertTriangle}
            title="Analytics unavailable"
            description={
              revenueQ.error?.message ??
              overviewQ.error?.message ??
              "Try refreshing in a moment."
            }
          />
        </Section>
      ) : null}

      <section
        aria-label="Revenue KPIs"
        className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard
          label={`Total fees · ${days}d`}
          value={totalFees}
          display={(n) => compactUsd(n)}
          icon={DollarSign}
          tone="emerald"
          hint={`${series.length} active days`}
        />
        <StatCard
          label="Avg / day"
          value={avgFee}
          display={(n) => compactUsd(n)}
          icon={TrendingUp}
          tone="violet"
          hint={peakDay ? `Peak ${peakDay}` : "No peak"}
        />
        <StatCard
          label="7d notional"
          value={volume7d}
          display={(n) => compactUsd(n)}
          icon={BarChart3}
          tone="cyan"
          hint={`${trades7d.toLocaleString()} fills`}
        />
        <StatCard
          label="Implied take rate"
          value={takeRateBps}
          display={(n) =>
            `${(n).toFixed(takeRateBps >= 100 ? 0 : 1)} bps`
          }
          icon={Activity}
          tone="amber"
          hint={`${(takeRateBps / 100).toFixed(2)}% of notional`}
        />
      </section>

      <Section
        title="Fee revenue & cumulative take"
        description={`Last ${days} days · daily bars + cumulative line`}
      >
        {revenueQ.isLoading ? (
          <div className="skeleton-shimmer m-3 h-[280px] rounded-xl ring-1 ring-[var(--hub-border)]" />
        ) : series.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No fee events yet"
            description="Once trades execute, fee revenue will be plotted here."
          />
        ) : (
          <div className="px-1 pb-2 pt-3">
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={series} margin={{ top: 4, right: 16, left: 4, bottom: 0 }}>
                <defs>
                  <linearGradient id="cumFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgb(34,211,238)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="rgb(34,211,238)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 6"
                  stroke="rgba(255,255,255,0.06)"
                  vertical={false}
                />
                <XAxis
                  dataKey="day"
                  tick={{ fill: "#71717a", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(d) => String(d).slice(5)}
                  minTickGap={24}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fill: "#52525b", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={48}
                  tickFormatter={(v) => compactUsd(Number(v))}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fill: "#52525b", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={48}
                  tickFormatter={(v) => compactUsd(Number(v))}
                />
                <Tooltip
                  contentStyle={{
                    background: "rgba(10,10,14,0.96)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "10px",
                    fontSize: "12px",
                  }}
                  formatter={(value, name) => [
                    compactUsd(Number(value ?? 0)),
                    name === "fees" ? "Daily" : "Cumulative",
                  ]}
                />
                <Bar
                  yAxisId="left"
                  dataKey="fees"
                  fill="rgba(167,139,250,0.55)"
                  stroke="rgba(167,139,250,0.9)"
                  strokeWidth={1}
                  radius={[3, 3, 0, 0]}
                  isAnimationActive={series.length < 90}
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="cum"
                  stroke="rgb(34,211,238)"
                  strokeWidth={1.6}
                  fill="url(#cumFill)"
                  dot={false}
                  isAnimationActive={series.length < 90}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="cum"
                  stroke="rgb(34,211,238)"
                  strokeWidth={1.6}
                  dot={false}
                  isAnimationActive={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </Section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Section
          title="7d volume profile"
          description="Daily notional · derived from fee shape"
        >
          {volumeProfile.length === 0 ? (
            <EmptyState
              icon={BarChart3}
              title="No 7d data yet"
              description="Volume will populate once trades clear."
            />
          ) : (
            <div className="px-1 pb-2 pt-3">
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart
                  data={volumeProfile}
                  margin={{ top: 4, right: 8, left: 4, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="volFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgb(52,211,153)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="rgb(52,211,153)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 6"
                    stroke="rgba(255,255,255,0.06)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="day"
                    tick={{ fill: "#71717a", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(d) => String(d).slice(5)}
                  />
                  <YAxis
                    tick={{ fill: "#52525b", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    width={48}
                    tickFormatter={(v) => compactUsd(Number(v))}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(10,10,14,0.96)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "10px",
                      fontSize: "12px",
                    }}
                    formatter={(value, name) => [
                      name === "volume"
                        ? compactUsd(Number(value ?? 0))
                        : compactInt(Number(value ?? 0)),
                      name === "volume" ? "Notional" : "Trades",
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="volume"
                    stroke="rgb(52,211,153)"
                    strokeWidth={1.6}
                    fill="url(#volFill)"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Section>

        <Section
          title="Operations summary"
          description="Snapshot of platform throughput"
        >
          <ul className="divide-y divide-[var(--hub-border)] px-4 py-1 sm:px-5">
            {[
              {
                label: "Trades · 24h",
                value: compactInt(overviewQ.data?.trades24h ?? 0),
                hint: "Filled orders",
              },
              {
                label: "Trades · 7d",
                value: compactInt(trades7d),
                hint: "Rolling week",
              },
              {
                label: "Notional · 7d",
                value: compactUsd(volume7d),
                hint: "Buy + sell flow",
              },
              {
                label: "Fee events · all-time",
                value: compactInt(overviewQ.data?.platformFeeEvents ?? 0),
                hint: "Fees recorded",
              },
              {
                label: "Cumulative fees",
                value: compactUsd(parseDecimal(overviewQ.data?.platformFeesUsd)),
                hint: "Lifetime take",
              },
            ].map((row) => (
              <li
                key={row.label}
                className="flex items-center justify-between gap-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--hub-muted)]">
                    {row.label}
                  </p>
                  <p className="text-[10.5px] text-[var(--hub-muted)]">{row.hint}</p>
                </div>
                <p className="font-mono text-[14px] font-semibold tabular-nums text-white">
                  {row.value}
                </p>
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </TabShell>
  );
}
