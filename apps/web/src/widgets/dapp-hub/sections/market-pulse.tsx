"use client";

import {
  Activity,
  BarChart2,
  DollarSign,
  Link2,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { ROUTES } from "@/shared/constants/routes";
import { useHomeStatsQuery } from "@/shared/api/hooks";
import type { MarketSentiment } from "@/shared/contracts/hub-home";
import { cn } from "@/lib/utils";
import { fmtCount, fmtUsdCompact } from "../lib/format-hub-metrics";

const GRID_PATTERN =
  'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.02\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")';

function sentimentBadgeClass(sentiment: MarketSentiment): string {
  if (sentiment === "Bullish") {
    return "border-green-500/20 bg-green-500/10 text-green-400";
  }
  if (sentiment === "Neutral") {
    return "border-amber-500/20 bg-amber-500/10 text-amber-400";
  }
  return "border-red-500/20 bg-red-500/10 text-red-400";
}

function sentimentDotClass(sentiment: MarketSentiment): string {
  if (sentiment === "Bullish") return "bg-green-400";
  if (sentiment === "Neutral") return "bg-amber-400";
  return "bg-red-400";
}

function sentimentIconClass(sentiment: MarketSentiment): string {
  if (sentiment === "Bullish") return "text-green-400";
  if (sentiment === "Neutral") return "text-amber-400";
  return "text-red-400";
}

function PulseDot() {
  return (
    <span className="relative flex size-2" aria-hidden>
      <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/70" />
      <span className="relative size-2 rounded-full bg-emerald-400" />
    </span>
  );
}

function ChainDot({ className }: { className?: string }) {
  return (
    <span
      className={cn("inline-block size-2 shrink-0 rounded-full bg-[#F0B90B]", className)}
      aria-hidden
    />
  );
}

function StatCell({
  label,
  value,
  icon: Icon,
  iconClass,
  valueNode,
}: {
  label: string;
  value?: string;
  icon: LucideIcon;
  iconClass: string;
  valueNode?: ReactNode;
}) {
  return (
    <div className="relative pr-6">
      <Icon className={cn("absolute right-0 top-0 size-4", iconClass)} strokeWidth={2} aria-hidden />
      {valueNode ?? (
        <p className="text-2xl font-bold leading-none tracking-tight text-white">{value}</p>
      )}
      <p className="mt-0.5 text-xs uppercase tracking-wider text-slate-500">{label}</p>
    </div>
  );
}

function MarketPulseSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a1f3a] via-[#0f1117] to-[#1a0f2e]">
      <div
        className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: GRID_PATTERN }}
        aria-hidden
      />
      <div className="relative grid grid-cols-1 gap-0 lg:grid-cols-5">
        <div className="space-y-4 p-8 lg:col-span-3">
          <div className="h-7 w-56 animate-pulse rounded-full bg-white/5" />
          <div className="h-3 w-28 animate-pulse rounded bg-white/5" />
          <div className="h-24 w-40 animate-pulse rounded-lg bg-white/5" />
          <div className="h-8 w-28 animate-pulse rounded-full bg-white/5" />
          <div className="mt-6 h-5 w-64 animate-pulse rounded bg-white/5" />
          <div className="h-5 w-40 animate-pulse rounded bg-white/5" />
          <div className="mt-8 flex gap-3">
            <div className="h-10 w-36 animate-pulse rounded-xl bg-white/5" />
            <div className="h-10 w-36 animate-pulse rounded-xl bg-white/5" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 border-t border-white/5 p-6 lg:col-span-2 lg:border-l lg:border-t-0">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-white/5" />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Section 1 — Market Pulse: attention index hero + quick stats grid.
 */
export function MarketPulse() {
  const statsQ = useHomeStatsQuery();
  const stats = statsQ.data;
  const loading = statsQ.isLoading && !stats;

  if (loading) {
    return (
      <section className="hub-section !pt-5 sm:!pt-6" aria-label="Market Pulse">
        <MarketPulseSkeleton />
      </section>
    );
  }

  const attentionIndex = Math.round(stats?.attentionIndex ?? 0);
  const empty = attentionIndex === 0;
  const sentiment: MarketSentiment = stats?.sentiment ?? "Neutral";
  const displayIndex = empty ? "—" : String(attentionIndex);
  const currentMeta = empty ? "—" : (stats?.currentMeta?.trim() || "—");
  const topChain = empty ? "—" : (stats?.topChain?.trim() || "BNB");

  return (
    <section className="hub-section !pt-5 sm:!pt-6" aria-label="Market Pulse">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a1f3a] via-[#0f1117] to-[#1a0f2e]">
        <div
          className="pointer-events-none absolute inset-0"
          style={{ backgroundImage: GRID_PATTERN }}
          aria-hidden
        />

        <div className="relative grid grid-cols-1 gap-0 lg:grid-cols-5">
          {/* LEFT — Attention hero */}
          <div className="p-8 lg:col-span-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs text-indigo-400">
              <PulseDot />
              LIVE — Crypto Attention Market
            </span>

            <div className="mt-4">
              <p className="text-xs uppercase tracking-widest text-slate-400">
                Attention Index
              </p>
              <p className="text-8xl font-black leading-none text-white">{displayIndex}</p>
              <span
                className={cn(
                  "mt-2 inline-flex items-center gap-1.5 rounded-full border px-4 py-1 text-sm font-medium",
                  empty
                    ? "border-amber-500/20 bg-amber-500/10 text-amber-400"
                    : sentimentBadgeClass(sentiment),
                )}
              >
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    empty ? "bg-amber-400" : sentimentDotClass(sentiment),
                  )}
                  aria-hidden
                />
                {empty ? "Neutral" : sentiment}
              </span>
            </div>

            <div className="mt-6 space-y-2 text-sm text-slate-400">
              <p>
                Current Meta:{" "}
                <span className="font-semibold text-white">{currentMeta}</span>
              </p>
              <p className="inline-flex items-center gap-2">
                Top Chain:{" "}
                <span className="inline-flex items-center gap-1.5 font-semibold text-white">
                  {!empty ? <ChainDot /> : null}
                  {topChain}
                </span>
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={ROUTES.markets}
                className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
              >
                Explore Markets
              </Link>
              <Link
                href={ROUTES.attention}
                className="rounded-xl border border-white/10 bg-white/5 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
              >
                View Narratives
              </Link>
            </div>

            {empty ? (
              <p className="mt-6 text-xs text-slate-500">
                Metrics populate after first market trades
              </p>
            ) : null}
          </div>

          {/* RIGHT — Stats */}
          <div className="border-t border-white/5 p-6 lg:col-span-2 lg:border-l lg:border-t-0">
            <div className="grid grid-cols-2 gap-4">
              <StatCell
                label="24H Volume"
                value={empty ? "—" : fmtUsdCompact(stats?.volume24hUsd ?? 0)}
                icon={TrendingUp}
                iconClass="text-green-400"
              />
              <StatCell
                label="Open Interest"
                value={empty ? "—" : fmtUsdCompact(stats?.openInterest ?? 0)}
                icon={DollarSign}
                iconClass="text-blue-400"
              />
              <StatCell
                label="Live Markets"
                value={empty ? "—" : fmtCount(stats?.liveMarkets ?? 0)}
                icon={BarChart2}
                iconClass="text-purple-400"
              />
              <StatCell
                label="Active Traders"
                value={empty ? "—" : fmtCount(stats?.activeTraders ?? 0)}
                icon={Users}
                iconClass="text-orange-400"
              />
              <StatCell
                label="Sentiment"
                icon={Activity}
                iconClass={empty ? "text-slate-500" : sentimentIconClass(sentiment)}
                valueNode={
                  empty ? (
                    <p className="text-2xl font-bold text-white">—</p>
                  ) : (
                    <span
                      className={cn(
                        "inline-flex rounded-full border px-2.5 py-0.5 text-sm font-medium",
                        sentimentBadgeClass(sentiment),
                      )}
                    >
                      {sentiment}
                    </span>
                  )
                }
              />
              <StatCell
                label="Top Chain"
                icon={Link2}
                iconClass="text-amber-400"
                valueNode={
                  empty ? (
                    <p className="text-2xl font-bold text-white">—</p>
                  ) : (
                    <p className="inline-flex items-center gap-2 text-2xl font-bold text-white">
                      <ChainDot />
                      {topChain}
                    </p>
                  )
                }
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
