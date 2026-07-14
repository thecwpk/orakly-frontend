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
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { BNB_CHAIN_SVG } from "@/shared/constants/brand-logos";
import { ROUTES } from "@/shared/constants/routes";
import { useHomeStatsQuery } from "@/shared/api/hooks";
import type { MarketSentiment } from "@/shared/contracts/hub-home";
import { cn } from "@/lib/utils";
import { fmtCount, fmtUsdCompact } from "../lib/format-hub-metrics";

function sentimentBadgeClass(sentiment: MarketSentiment): string {
  if (sentiment === "Bullish") {
    return "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30";
  }
  if (sentiment === "Neutral") {
    return "bg-amber-500/15 text-amber-300 ring-amber-400/30";
  }
  return "bg-rose-500/15 text-rose-300 ring-rose-400/30";
}

function StatCard({
  label,
  value,
  icon: Icon,
  iconClass,
  loading,
  trailing,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  iconClass: string;
  loading?: boolean;
  trailing?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "relative rounded-xl border border-[var(--hub-border)] bg-[var(--hub-card)] p-3",
        "shadow-[0_1px_0_rgba(255,255,255,0.03)_inset]",
      )}
    >
      <Icon
        className={cn("absolute right-3 top-3 size-5", iconClass)}
        strokeWidth={2}
        aria-hidden
      />
      {loading ? (
        <div className="hub-skeleton mt-1 h-7 w-20" />
      ) : (
        <div className="flex min-h-7 items-center gap-1.5 pr-7">
          <p className="text-[20px] font-bold leading-none tracking-tight text-[var(--hub-fg)]">
            {value}
          </p>
          {trailing}
        </div>
      )}
      <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--hub-muted)]">
        {label}
      </p>
    </div>
  );
}

function MarketPulseSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr_1fr] lg:gap-5">
      <div className="hub-skeleton h-[22rem] rounded-2xl sm:h-[20rem]" />
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="hub-skeleton h-[5.25rem] rounded-xl" />
        ))}
      </div>
    </div>
  );
}

function BnbMark({ className }: { className?: string }) {
  return (
    <Image
      src={BNB_CHAIN_SVG}
      alt=""
      width={18}
      height={18}
      className={cn("inline-block size-[18px] object-contain", className)}
      unoptimized
    />
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
  const sentiment: MarketSentiment = stats?.sentiment ?? "Bearish";
  const sentimentIconTone =
    sentiment === "Bullish"
      ? "text-emerald-400"
      : sentiment === "Neutral"
        ? "text-amber-400"
        : "text-rose-400";

  return (
    <section className="hub-section !pt-5 sm:!pt-6" aria-label="Market Pulse">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[3fr_2fr] lg:gap-5">
        {/* Left — Platform Overview (~60%) */}
        <div
          className={cn(
            "relative overflow-hidden rounded-2xl p-6",
            "border border-[var(--hub-border)]",
            "bg-[linear-gradient(145deg,rgba(30,56,110,0.95)_0%,rgba(16,28,52,0.98)_48%,rgba(12,22,42,1)_100%)]",
            "shadow-[0_20px_50px_-28px_rgba(0,0,0,0.65)]",
          )}
        >
          <div
            className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full bg-[var(--hub-primary)]/20 blur-3xl"
            aria-hidden
          />

          <div className="relative flex items-center justify-between gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--hub-muted)]">
              Orakly Attention Market
            </p>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-300">
              <span className="relative flex size-2">
                <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/70" />
                <span className="relative size-2 rounded-full bg-emerald-400" />
              </span>
              Live
            </span>
          </div>

          <div className="relative mt-6">
            <p className="text-[13px] text-[var(--hub-muted)]">Attention Index</p>
            <p className="mt-1 text-[72px] font-bold leading-none tracking-tight text-[var(--hub-fg)]">
              {attentionIndex}
            </p>
            <span
              className={cn(
                "mt-3 inline-flex rounded-md px-2.5 py-1 text-[12px] font-semibold ring-1",
                sentimentBadgeClass(sentiment),
              )}
            >
              {sentiment}
            </span>
          </div>

          <div className="relative mt-6 space-y-2.5">
            <p className="text-[16px] font-medium text-[var(--hub-fg)]">
              <span className="text-[var(--hub-muted)]">Current Meta:</span>{" "}
              {stats?.currentMeta ?? "—"}
            </p>
            <p className="flex items-center gap-2 text-[16px] font-medium text-[var(--hub-fg)]">
              <span className="text-[var(--hub-muted)]">Top Chain:</span>
              <BnbMark />
              <span>{stats?.topChain ?? "BNB"}</span>
            </p>
          </div>

          <div className="relative mt-8 flex flex-wrap gap-3">
            <Link href={ROUTES.markets} className="hub-btn-primary px-5 py-2.5 text-sm">
              Explore Markets
            </Link>
            <Link
              href={ROUTES.attention}
              className={cn(
                "inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-semibold transition",
                "border border-[var(--hub-border-strong)] bg-transparent text-[var(--hub-fg)]",
                "hover:bg-white/[0.04]",
              )}
            >
              View Narratives
            </Link>
          </div>
        </div>

        {/* Right — Quick Stats (~40%) */}
        <div className="grid grid-cols-2 gap-3 content-start">
          <StatCard
            label="24H Volume"
            value={fmtUsdCompact(stats?.volume24hUsd ?? 0)}
            icon={TrendingUp}
            iconClass="text-emerald-400"
            loading={statsQ.isLoading}
          />
          <StatCard
            label="Open Interest"
            value={fmtUsdCompact(stats?.openInterest ?? 0)}
            icon={DollarSign}
            iconClass="text-sky-400"
            loading={statsQ.isLoading}
          />
          <StatCard
            label="Live Markets"
            value={fmtCount(stats?.liveMarkets ?? 0)}
            icon={BarChart2}
            iconClass="text-violet-400"
            loading={statsQ.isLoading}
          />
          <StatCard
            label="Active Traders"
            value={fmtCount(stats?.activeTraders ?? 0)}
            icon={Users}
            iconClass="text-orange-400"
            loading={statsQ.isLoading}
          />
          <StatCard
            label="Market Sentiment"
            value={sentiment}
            icon={Activity}
            iconClass={sentimentIconTone}
            loading={statsQ.isLoading}
          />
          <StatCard
            label="Top Chain"
            value={stats?.topChain ?? "BNB"}
            icon={Link2}
            iconClass="text-amber-400"
            loading={statsQ.isLoading}
            trailing={<BnbMark className="size-4" />}
          />
        </div>
      </div>
    </section>
  );
}
