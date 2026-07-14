"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchAttentionDashboard } from "@/shared/api/fetchers/attention-dashboard";
import { queryKeys } from "@/shared/api/query-keys";
import type {
  AttentionDashboardItem,
  AttentionMomentum,
} from "@/shared/contracts/attention-dashboard";
import { fmtUsdCompact } from "../lib/format-hub-metrics";

type SortKey = "trending" | "growing" | "volume" | "newest";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "trending", label: "Trending" },
  { value: "growing", label: "Growing" },
  { value: "volume", label: "Highest Volume" },
  { value: "newest", label: "Newest" },
];

const MOMENTUM_BADGE: Record<
  AttentionMomentum,
  { label: string; className: string }
> = {
  Growing: {
    label: "↑ Growing",
    className: "border border-green-500/20 bg-green-500/10 text-green-400",
  },
  Cooling: {
    label: "↓ Cooling",
    className: "border border-red-500/20 bg-red-500/10 text-red-400",
  },
  Stable: {
    label: "→ Stable",
    className: "border border-white/10 bg-white/5 text-slate-400",
  },
};

function scoreColor(score: number): string {
  if (score >= 67) return "text-green-400";
  if (score >= 34) return "text-amber-400";
  return "text-red-400";
}

function scoreBarColor(score: number): string {
  if (score >= 67) return "bg-green-400";
  if (score >= 34) return "bg-amber-400";
  return "bg-red-400";
}

function momentumPct(current: number, prev: number): number {
  if (!Number.isFinite(current)) return 0;
  if (!Number.isFinite(prev) || prev <= 0) return 0;
  return Number((((current - prev) / prev) * 100).toFixed(1));
}

function sortNarratives(
  rows: AttentionDashboardItem[],
  sort: SortKey,
): AttentionDashboardItem[] {
  const next = [...rows];
  switch (sort) {
    case "growing":
      return next.sort((a, b) => {
        const aG = a.momentum === "Growing" ? 1 : 0;
        const bG = b.momentum === "Growing" ? 1 : 0;
        if (bG !== aG) return bG - aG;
        return b.attentionScore - a.attentionScore;
      });
    case "volume":
      return next.sort((a, b) => b.volume24hUsd - a.volume24hUsd);
    case "newest":
      return next.sort(
        (a, b) =>
          new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime(),
      );
    case "trending":
    default:
      return next.sort((a, b) => b.attentionScore - a.attentionScore);
  }
}

function NarrativeSkeletonCard() {
  return (
    <div className="min-w-[200px] max-w-[200px] animate-pulse rounded-2xl border border-white/5 bg-white/[0.02] p-4">
      <div className="mb-4 h-3 w-24 rounded bg-white/10" />
      <div className="mb-3 h-10 w-12 rounded bg-white/10" />
      <div className="mb-2 h-2 w-full rounded bg-white/5" />
      <div className="h-2 w-20 rounded bg-white/5" />
    </div>
  );
}

function NarrativeCard({ item }: { item: AttentionDashboardItem }) {
  const badge = MOMENTUM_BADGE[item.momentum];
  const score = Math.round(item.attentionScore);
  const pct = momentumPct(item.attentionScore, item.scorePrev24h);
  const pctPositive = pct >= 0;
  const href = `/narratives/${encodeURIComponent(item.narrativeSlug)}`;

  return (
    <Link
      href={href}
      className={cn(
        "group flex min-w-[200px] max-w-[200px] cursor-pointer flex-col rounded-2xl border border-white/5 p-4",
        "bg-gradient-to-b from-[var(--background-card)] to-[#0f1117]",
        "transition-all duration-200",
        "hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/5",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="min-w-0 truncate text-sm font-semibold text-white">
          {item.narrativeName}
        </h3>
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
            badge.className,
          )}
        >
          {badge.label}
        </span>
      </div>

      <div className="mt-3">
        <p className="text-[10px] uppercase tracking-widest text-slate-500">
          Attention
        </p>
        <p className={cn("text-4xl font-black leading-none tabular-nums", scoreColor(score))}>
          {score}
        </p>
        <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-white/5">
          <div
            className={cn("h-full rounded-full transition-all", scoreBarColor(score))}
            style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
          />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-[10px] text-slate-500">CONVICTION</span>
        <span className="text-sm font-bold tabular-nums text-slate-300">
          {Math.round(item.convictionScore)}
        </span>
      </div>

      <div className="mt-1 flex items-center justify-between gap-2">
        <span className="text-[10px] text-slate-500">MOMENTUM</span>
        <span
          className={cn(
            "text-sm font-bold tabular-nums",
            pctPositive ? "text-green-400" : "text-red-400",
          )}
        >
          {pctPositive ? "+" : ""}
          {pct}%
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/5 pt-3">
        <span className="text-[11px] text-slate-500">
          Markets:{" "}
          <span className="font-medium text-slate-300">{item.activeMarkets}</span>
        </span>
        <span className="text-[11px] text-slate-500">
          Vol:{" "}
          <span className="font-medium text-slate-300">
            {fmtUsdCompact(item.volume24hUsd)}
          </span>
        </span>
      </div>

      <span
        className={cn(
          "mt-3 block w-full rounded-lg py-1.5 text-center text-xs text-indigo-400",
          "transition-colors group-hover:bg-indigo-500/10 group-hover:text-indigo-300",
        )}
      >
        View Narrative →
      </span>
    </Link>
  );
}

/**
 * Section 2 — Trending Narratives: horizontal cards of attention flow.
 */
export function TrendingNarratives() {
  const [sort, setSort] = useState<SortKey>("trending");

  const query = useQuery({
    queryKey: queryKeys.hub.attentionDashboard(8),
    queryFn: () => fetchAttentionDashboard(8),
    staleTime: 20_000,
    refetchInterval: 30_000,
  });

  const rows = useMemo(() => {
    const data = query.data?.data ?? [];
    const real = data.filter((row) => !row._isMock);
    const source = real.length > 0 ? real : data;
    if (data.length > 0 && data.every((row) => row._isMock)) {
      return [];
    }
    return sortNarratives(source.slice(0, 8), sort);
  }, [query.data, sort]);

  const showEmpty = !query.isLoading && rows.length === 0;
  const showSkeletons = query.isLoading && rows.length === 0;

  return (
    <section className="hub-section" aria-label="Trending Narratives">
      <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Trending Narratives</h2>
          <p className="mt-0.5 text-sm text-slate-500">Where attention is flowing</p>
        </div>

        <label className="relative inline-flex shrink-0 items-center">
          <span className="sr-only">Sort narratives</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className={cn(
              "appearance-none rounded-lg border border-white/10 bg-white/5",
              "py-1.5 pl-3 pr-8 text-sm text-slate-300",
              "focus:outline-none focus:ring-2 focus:ring-indigo-500/30",
            )}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-2.5 size-3.5 text-slate-500"
            aria-hidden
          />
        </label>
      </div>

      <div
        className={cn(
          "flex gap-4 overflow-x-auto pb-3",
          "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        )}
      >
        {showSkeletons || showEmpty
          ? Array.from({ length: 4 }).map((_, i) => (
              <NarrativeSkeletonCard key={i} />
            ))
          : rows.map((item) => <NarrativeCard key={item.id} item={item} />)}
      </div>

      {showEmpty ? (
        <p className="mt-2 text-center text-xs text-slate-600">
          Narrative data loads after first market activity
        </p>
      ) : null}
    </section>
  );
}
