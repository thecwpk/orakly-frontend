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
  Settings2,
  ShieldAlert,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";
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
import { adminUi } from "../lib/admin-ui-classes";
import { ROUTES } from "@/shared/constants/routes";

const STATUS_TONE: Record<string, { ring: string; bg: string; text: string }> = {
  OPEN: { ring: "ring-emerald-400/30", bg: "bg-emerald-500/10", text: "text-emerald-200" },
  DRAFT: { ring: "ring-amber-400/30", bg: "bg-amber-500/10", text: "text-amber-200" },
  PAUSED: { ring: "ring-rose-400/30", bg: "bg-rose-500/10", text: "text-rose-200" },
  CLOSED: { ring: "ring-[var(--hub-border-strong)]", bg: "bg-[var(--hub-primary-soft)]", text: "text-[var(--hub-primary-bright)]" },
  RESOLVED: { ring: "ring-cyan-400/30", bg: "bg-cyan-500/10", text: "text-cyan-200" },
  CANCELED: { ring: "ring-zinc-400/30", bg: "bg-zinc-500/10", text: "text-[var(--hub-muted)]" },
};

const FALLBACK_TONE = STATUS_TONE.OPEN!;

export function AdminOverviewTab({
  permissions,
  role,
}: {
  permissions: ReadonlyArray<string>;
  role?: string;
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
        <div className="flex flex-wrap items-center gap-2">
          {role === "ADMIN" ? (
            <Link href={ROUTES.adminConfig} className={adminUi.btnGhost}>
              <Settings2 className="h-3.5 w-3.5" />
              Metrics config
            </Link>
          ) : null}
          <button
            type="button"
            onClick={refresh}
            disabled={overviewQ.isFetching || revenueQ.isFetching}
            className={adminUi.btnGhost}
          >
          <RefreshCw
            className={cn(
              "h-3.5 w-3.5",
              (overviewQ.isFetching || revenueQ.isFetching) && "animate-spin",
            )}
          />
          Refresh
        </button>
        </div>
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
              className={cn(adminUi.skeleton, "h-[100px] rounded-2xl")}
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
                        <stop offset="0%" stopColor="rgb(59,130,246)" stopOpacity={0.45} />
                        <stop offset="100%" stopColor="rgb(59,130,246)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 6"
                      stroke="color-mix(in srgb, var(--hub-border) 80%, transparent)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="day"
                      tick={{ fill: "var(--hub-muted)", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(d) => String(d).slice(5)}
                      minTickGap={24}
                    />
                    <YAxis
                      tick={{ fill: "var(--hub-muted)", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      width={48}
                      tickFormatter={(v) => compactUsd(Number(v))}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "var(--hub-card)",
                        border: "1px solid var(--hub-border)",
                        borderRadius: "var(--hub-radius)",
                        fontSize: "12px",
                        color: "var(--hub-fg)",
                      }}
                      formatter={(value) => [
                        compactUsd(Number(value ?? 0)),
                        "Fees",
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="fees"
                      stroke="rgb(59,130,246)"
                      strokeWidth={1.6}
                      fill="url(#feeFillOverview)"
                      dot={false}
                      activeDot={{ r: 3, fill: "rgb(59,130,246)" }}
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
                  <li className="text-[12px] text-[var(--hub-muted)]">No markets yet.</li>
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
                          <span className="font-mono tabular-nums text-[var(--hub-fg)]">
                            {count.toLocaleString()}{" "}
                            <span className="text-[var(--hub-muted)]">
                              ({pct.toFixed(0)}%)
                            </span>
                          </span>
                        </div>
                        <div className="h-1 overflow-hidden rounded-full bg-[var(--hub-track-bg)]">
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
                <p className="text-[12px] text-[var(--hub-muted)]">
                  No admin permissions are granted to this account.
                </p>
              ) : (
                grantedPermissions.map((label) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-1 rounded-md border border-[var(--hub-border)] bg-[var(--hub-bg-subtle)] px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wider text-[var(--hub-muted)]"
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
        <div className="flex items-center gap-2 text-[10.5px] text-[var(--hub-muted)]">
          <Loader2 className="h-3 w-3 animate-spin" />
          Refreshing…
        </div>
      ) : null}
    </TabShell>
  );
}
