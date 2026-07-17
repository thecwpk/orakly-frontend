"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowDown, ArrowUp, ChevronDown, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchAttentionDashboard } from "@/shared/api/fetchers/attention-dashboard";
import { queryKeys } from "@/shared/api/query-keys";
import { ROUTES } from "@/shared/constants/routes";
import type {
  AttentionDashboardItem,
  AttentionMomentum,
} from "@/shared/contracts/attention-dashboard";
import { fmtUsdCompact } from "../lib/format-hub-metrics";
import { TRENDING_NARRATIVES_DEMO } from "../lib/trending-narratives-demo";

type SortKey = "trending" | "growing" | "volume" | "newest";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "trending", label: "Trending" },
  { value: "growing", label: "Growing" },
  { value: "volume", label: "Highest Volume" },
  { value: "newest", label: "Newest" },
];

function scoreValueClass(score: number): string {
  if (score >= 67) return "hub-dapp-move-up";
  if (score >= 34) return "text-amber-300";
  return "hub-dapp-move-down";
}

function scoreFillClass(score: number): string {
  if (score >= 67) return "hub-dapp-score-fill--high";
  if (score >= 34) return "hub-dapp-score-fill--mid";
  return "hub-dapp-score-fill--low";
}

export function momentumPct(current: number, prev: number): number {
  if (!Number.isFinite(current)) return 0;
  if (!Number.isFinite(prev) || prev <= 0) return 0;
  return Number((((current - prev) / prev) * 100).toFixed(1));
}

function growingRank(momentum: AttentionMomentum): number {
  if (momentum === "Growing") return 2;
  if (momentum === "Stable") return 1;
  return 0;
}

function sortNarratives(
  rows: AttentionDashboardItem[],
  sort: SortKey,
): AttentionDashboardItem[] {
  const next = [...rows];
  switch (sort) {
    case "growing":
      return next.sort((a, b) => {
        const rank = growingRank(b.momentum) - growingRank(a.momentum);
        if (rank !== 0) return rank;
        const pctA = momentumPct(a.attentionScore, a.scorePrev24h);
        const pctB = momentumPct(b.attentionScore, b.scorePrev24h);
        if (pctB !== pctA) return pctB - pctA;
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

function fmtVolume(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "$0";
  const compact = fmtUsdCompact(n);
  return compact === "N/A" ? `$${Math.round(n).toLocaleString()}` : compact;
}

function NarrativeSkeletonCard() {
  return (
    <div className="hub-dapp-skel-card hub-dapp-narrative">
      <div className="hub-dapp-skel mb-4 h-3.5 w-28" />
      <div className="hub-dapp-skel mb-2 h-2.5 w-16" />
      <div className="hub-dapp-skel mb-3 h-10 w-14" />
      <div className="hub-dapp-skel mb-4 h-1.5 w-full rounded-full" />
      <div className="hub-dapp-skel mb-2 h-3 w-full" />
      <div className="hub-dapp-skel mb-2 h-3 w-4/5" />
      <div className="hub-dapp-skel mt-3 h-9 w-full rounded-lg" />
    </div>
  );
}

function NarrativeCard({ item }: { item: AttentionDashboardItem }) {
  const score = Math.round(item.attentionScore);
  const conviction = Math.round(item.convictionScore);
  const pct = momentumPct(item.attentionScore, item.scorePrev24h);
  const positive = pct >= 0;
  const href = ROUTES.narrativeDetail(item.narrativeSlug);

  return (
    <article className="hub-dapp-card hub-dapp-card--interactive hub-dapp-narrative">
      <h3 className="hub-dapp-narrative-title">{item.narrativeName}</h3>

      <div className="mt-3.5">
        <span className="hub-dapp-stat-label">Attention</span>
        <p
          className={cn(
            "hub-dapp-stat-value hub-dapp-stat-value--lg mt-1",
            scoreValueClass(score),
          )}
        >
          {score}
        </p>
        <div className="hub-dapp-score-track mt-2">
          <div
            className={cn("hub-dapp-score-fill", scoreFillClass(score))}
            style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
          />
        </div>
      </div>

      <div className="hub-dapp-narrative-meta">
        <div className="hub-dapp-narrative-row">
          <span className="hub-dapp-stat-label">Conviction</span>
          <span className="hub-dapp-stat-value hub-dapp-stat-value--md">
            {conviction}
          </span>
        </div>
        <div className="hub-dapp-narrative-row">
          <span className="hub-dapp-stat-label">Momentum</span>
          <span
            className={cn(
              "inline-flex items-center gap-0.5 hub-dapp-stat-value hub-dapp-stat-value--md",
              positive ? "hub-dapp-move-up" : "hub-dapp-move-down",
            )}
          >
            {positive ? (
              <ArrowUp className="size-3.5 shrink-0" aria-hidden />
            ) : (
              <ArrowDown className="size-3.5 shrink-0" aria-hidden />
            )}
            {positive ? "+" : ""}
            {pct}%
          </span>
        </div>
      </div>

      <div className="hub-dapp-narrative-foot">
        <div className="hub-dapp-narrative-row">
          <span className="hub-dapp-stat-label">Markets</span>
          <span className="hub-dapp-stat-value hub-dapp-stat-value--sm">
            {item.activeMarkets}
          </span>
        </div>
        <div className="hub-dapp-narrative-row">
          <span className="hub-dapp-stat-label">Volume</span>
          <span className="hub-dapp-stat-value hub-dapp-stat-value--sm">
            {fmtVolume(item.volume24hUsd)}
          </span>
        </div>
      </div>

      <Link href={href} className="hub-dapp-cta">
        View Narrative
      </Link>
    </article>
  );
}

function ResolveRows(
  payload: AttentionDashboardItem[] | undefined,
): { rows: AttentionDashboardItem[]; source: "api" | "demo" } {
  const data = payload ?? [];
  const real = data.filter((row) => !row._isMock);
  if (real.length > 0) {
    return { rows: real.slice(0, 12), source: "api" };
  }
  // Empty API or server-only mock rows → client demo desk (richer, sortable).
  return {
    rows: [...TRENDING_NARRATIVES_DEMO],
    source: "demo",
  };
}

/**
 * Section 2 — Trending Narratives: attention cards + working sort controls.
 */
export function TrendingNarratives() {
  const [sort, setSort] = useState<SortKey>("trending");

  const query = useQuery({
    queryKey: queryKeys.hub.attentionDashboard(12),
    queryFn: () => fetchAttentionDashboard(12),
    staleTime: 20_000,
    refetchInterval: 30_000,
    retry: 1,
  });

  const resolved = useMemo(() => {
    if (query.isLoading && !query.data) {
      return { rows: [] as AttentionDashboardItem[], source: "api" as const };
    }
    // API error or empty → demo desk (never leave the section blank).
    if (query.isError || !query.data) {
      return {
        rows: [...TRENDING_NARRATIVES_DEMO],
        source: "demo" as const,
      };
    }
    return ResolveRows(query.data.data);
  }, [query.data, query.isError, query.isLoading]);

  const rows = useMemo(
    () => sortNarratives(resolved.rows, sort),
    [resolved.rows, sort],
  );

  const showSkeletons = query.isLoading && !query.data && !query.isError;
  const showError = false;

  return (
    <section className="hub-section" aria-label="Trending Narratives">
      <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Trending Narratives</h2>
          <p className="mt-0.5 text-sm text-slate-500">Where trading attention is concentrating.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {resolved.source === "demo" && !showError && !showSkeletons ? (
            <span className="rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-500">
              Demo narratives
            </span>
          ) : null}
          <div className="relative inline-flex shrink-0 items-center">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              disabled={showSkeletons || showError}
              aria-label="Sort narratives"
              className={cn(
                "appearance-none rounded-lg border border-white/10 bg-white/5",
                "py-1.5 pl-3 pr-8 text-sm text-slate-300",
                "focus:outline-none focus:ring-2 focus:ring-indigo-500/30",
                "disabled:cursor-not-allowed disabled:opacity-50",
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
          </div>
        </div>
      </div>

      {showError ? (
        <div className="rounded-2xl border border-dashed border-rose-400/30 bg-rose-500/5 px-6 py-10 text-center">
          <p className="text-sm font-semibold text-white">Unable to load narratives.</p>
          <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500">
            {query.error instanceof Error
              ? query.error.message
              : "The attention feed is unavailable."}
          </p>
          <button
            type="button"
            onClick={() => void query.refetch()}
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
          >
            <RefreshCw className="size-3.5" aria-hidden />
            Retry
          </button>
        </div>
      ) : (
        <div className="hub-dapp-rail">
          {showSkeletons
            ? Array.from({ length: 6 }).map((_, i) => (
                <NarrativeSkeletonCard key={i} />
              ))
            : rows.map((item) => <NarrativeCard key={item.id} item={item} />)}
        </div>
      )}
    </section>
  );
}
