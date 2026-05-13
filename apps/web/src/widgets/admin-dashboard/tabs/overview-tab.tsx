"use client";

import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  CircleDot,
  DollarSign,
  Loader2,
  RefreshCw,
  Repeat,
  ShieldAlert,
  TrendingUp,
  Users,
} from "lucide-react";
import { useMemo } from "react";
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
import { compactInt, compactUsd, parseDecimal } from "../lib/format";
import { ALL_PERMISSIONS } from "../lib/permissions";
import {
  useAdminOverviewQuery,
  useAdminRevenueQuery,
} from "../hooks/use-admin-queries";
import { Section, TabShell } from "../components/tab-shell";
import { StatCard } from "../components/stat-card";
import { EmptyState } from "../components/empty-state";

const STATUS_TONE: Record<string, { ring: string; bg: string; text: string }> = {
  OPEN: { ring: "ring-emerald-400/30", bg: "bg-emerald-500/10", text: "text-emerald-200" },
  DRAFT: { ring: "ring-amber-400/30", bg: "bg-amber-500/10", text: "text-amber-200" },
  PAUSED: { ring: "ring-rose-400/30", bg: "bg-rose-500/10", text: "text-rose-200" },
  CLOSED: { ring: "ring-violet-400/30", bg: "bg-violet-500/10", text: "text-violet-200" },
  RESOLVED: { ring: "ring-cyan-400/30", bg: "bg-cyan-500/10", text: "text-cyan-200" },
  CANCELED: { ring: "ring-zinc-400/30", bg: "bg-zinc-500/10", text: "text-zinc-300" },
};

const FALLBACK_TONE = STATUS_TONE.OPEN!;

export function AdminOverviewTab({
  permissions,
}: {
  permissions: ReadonlyArray<string>;
}) {
  const overviewQ = useAdminOverviewQuery(true);
  const revenueQ = useAdminRevenueQuery(45, true);

  const refresh = () => {
    void overviewQ.refetch();
    void revenueQ.refetch();
  };

  const chartData = useMemo(
    () =>
      (revenueQ.data?.series ?? []).map((s) => ({
        ...s,
        fees: parseDecimal(s.feesUsd),
      })),
    [revenueQ.data?.series],
  );

  const totalFees = parseDecimal(overviewQ.data?.platformFeesUsd);
  const volume7d = parseDecimal(overviewQ.data?.volumeNotional7dUsd);
  const moderationQueue = overviewQ.data?.moderationQueue ?? 0;

  const grantedPermissions = useMemo(
    () =>
      ALL_PERMISSIONS.filter((p) => permissions.includes(p.id)).map((p) => p.label),
    [permissions],
  );

  return (
    <TabShell
      eyebrow="Operations"
      title="Operator overview"
      description="Real-time platform health, fee revenue, and moderation queue. Auto-refreshes every 30s."
      actions={
        <button
          type="button"
          onClick={refresh}
          disabled={overviewQ.isFetching || revenueQ.isFetching}
          className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.04] px-2.5 py-1.5 text-[12px] font-medium text-zinc-200 ring-1 ring-white/[0.08] transition hover:bg-white/[0.08] disabled:opacity-50"
        >
          <RefreshCw
            className={cn(
              "h-3.5 w-3.5",
              (overviewQ.isFetching || revenueQ.isFetching) && "animate-spin",
            )}
          />
          Refresh
        </button>
      }
    >
      {overviewQ.isError ? (
        <Section>
          <EmptyState
            icon={AlertTriangle}
            title="Could not load analytics"
            description={overviewQ.error?.message ?? "Try refreshing."}
          />
        </Section>
      ) : null}

      {!overviewQ.data && overviewQ.isLoading ? (
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="skeleton-shimmer h-[100px] rounded-2xl ring-1 ring-white/[0.04]"
            />
          ))}
        </div>
      ) : null}

      {overviewQ.data ? (
        <>
          <section
            aria-label="Health KPIs"
            className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4"
          >
            <StatCard
              label="Users"
              value={overviewQ.data.usersTotal}
              display={(n) => Math.round(n).toLocaleString()}
              icon={Users}
              tone="cyan"
              hint="Registered accounts"
            />
            <StatCard
              label="Trades 24h"
              value={overviewQ.data.trades24h}
              display={(n) => Math.round(n).toLocaleString()}
              icon={Activity}
              tone="violet"
              hint={`${overviewQ.data.trades7d.toLocaleString()} this week`}
            />
            <StatCard
              label="Platform fees"
              value={totalFees}
              display={(n) => compactUsd(n)}
              icon={DollarSign}
              tone="emerald"
              hint={`${overviewQ.data.platformFeeEvents.toLocaleString()} fee events`}
            />
            <StatCard
              label="Moderation queue"
              value={moderationQueue}
              display={(n) => Math.round(n).toLocaleString()}
              icon={ShieldAlert}
              tone={moderationQueue > 0 ? "amber" : "neutral"}
              hint={moderationQueue > 0 ? "Drafts + paused" : "Queue clear"}
            />
          </section>

          <section
            aria-label="Volume KPIs"
            className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4"
          >
            <StatCard
              label="7d notional"
              value={volume7d}
              display={(n) => compactUsd(n)}
              icon={TrendingUp}
              tone="cyan"
              hint="Buy + sell flow"
              compact
            />
            <StatCard
              label="Open markets"
              value={overviewQ.data.marketsByStatus.OPEN ?? 0}
              display={(n) => Math.round(n).toLocaleString()}
              icon={CircleDot}
              tone="emerald"
              hint="Currently tradable"
              compact
            />
            <StatCard
              label="Resolved"
              value={overviewQ.data.marketsByStatus.RESOLVED ?? 0}
              display={(n) => Math.round(n).toLocaleString()}
              icon={CheckCircle2}
              tone="violet"
              hint="Settled markets"
              compact
            />
            <StatCard
              label="Avg fill / day"
              value={Math.round((overviewQ.data.trades7d ?? 0) / 7)}
              display={(n) => compactInt(n)}
              icon={Repeat}
              tone="neutral"
              hint="Last 7d"
              compact
            />
          </section>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
            <Section
              title="Fee revenue"
              description="Daily platform take · last 45 days"
            >
              <div className="px-1 pb-2 pt-3">
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart
                    data={chartData}
                    margin={{ top: 4, right: 12, left: 4, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="feeFillOverview" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgb(167,139,250)" stopOpacity={0.45} />
                        <stop offset="100%" stopColor="rgb(167,139,250)" stopOpacity={0} />
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
                      formatter={(value) => [
                        compactUsd(Number(value ?? 0)),
                        "Fees",
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="fees"
                      stroke="rgb(167,139,250)"
                      strokeWidth={1.6}
                      fill="url(#feeFillOverview)"
                      dot={false}
                      activeDot={{ r: 3, fill: "rgb(167,139,250)" }}
                      isAnimationActive={chartData.length < 90}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Section>

            <Section
              title="Markets by status"
              description="Lifecycle distribution"
            >
              <ul className="space-y-2 px-4 py-3 sm:px-5">
                {Object.entries(overviewQ.data.marketsByStatus).length === 0 ? (
                  <li className="text-[12px] text-zinc-500">No markets yet.</li>
                ) : (
                  Object.entries(overviewQ.data.marketsByStatus).map(([status, count]) => {
                    const tone = STATUS_TONE[status] ?? FALLBACK_TONE;
                    const total = Object.values(overviewQ.data!.marketsByStatus).reduce(
                      (a, b) => a + b,
                      0,
                    );
                    const pct = total > 0 ? (count / total) * 100 : 0;
                    return (
                      <li key={status} className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 font-bold uppercase ring-1",
                              tone.bg,
                              tone.text,
                              tone.ring,
                            )}
                          >
                            <span
                              className={cn(
                                "h-1.5 w-1.5 rounded-full",
                                tone.text.replace("text-", "bg-"),
                              )}
                              aria-hidden
                            />
                            {status}
                          </span>
                          <span className="font-mono tabular-nums text-zinc-200">
                            {count.toLocaleString()}{" "}
                            <span className="text-zinc-500">
                              ({pct.toFixed(0)}%)
                            </span>
                          </span>
                        </div>
                        <div className="h-1 overflow-hidden rounded-full bg-white/[0.04]">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{
                              type: "spring",
                              stiffness: 220,
                              damping: 28,
                            }}
                            className={cn("h-full", tone.text.replace("text-", "bg-"))}
                          />
                        </div>
                      </li>
                    );
                  })
                )}
              </ul>
            </Section>
          </div>

          <Section
            title="Effective permissions"
            description="Server enforces these on every API call."
          >
            <div className="flex flex-wrap gap-1.5 px-4 py-3 sm:px-5">
              {grantedPermissions.length === 0 ? (
                <p className="text-[12px] text-zinc-500">
                  No admin permissions are granted to this account.
                </p>
              ) : (
                grantedPermissions.map((label) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-1 rounded-md bg-white/[0.04] px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wider text-zinc-300 ring-1 ring-white/[0.08]"
                  >
                    <CheckCircle2 className="h-2.5 w-2.5 text-emerald-300" />
                    {label}
                  </span>
                ))
              )}
            </div>
          </Section>
        </>
      ) : null}

      {overviewQ.isFetching && overviewQ.data ? (
        <div className="flex items-center gap-2 text-[10.5px] text-zinc-500">
          <Loader2 className="h-3 w-3 animate-spin" />
          Refreshing…
        </div>
      ) : null}
    </TabShell>
  );
}
