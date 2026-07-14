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
    className: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/25",
  },
  Cooling: {
    label: "↓ Cooling",
    className: "bg-rose-500/15 text-rose-300 ring-rose-400/25",
  },
  Stable: {
    label: "→ Stable",
    className: "bg-white/[0.06] text-zinc-400 ring-white/[0.08]",
  },
};

function scoreColor(score: number): string {
  if (score < 34) return "text-rose-400";
  if (score < 67) return "text-amber-400";
  return "text-emerald-400";
}

function scoreBarColor(score: number): string {
  if (score < 34) return "bg-rose-400";
  if (score < 67) return "bg-amber-400";
  return "bg-emerald-400";
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

function LaunchingPlaceholder() {
  return (
    <div
      className={cn(
        "relative min-w-[220px] max-w-[220px] overflow-hidden rounded-2xl border border-[var(--hub-border)] p-4",
        "bg-[var(--hub-card)]",
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 animate-pulse bg-[linear-gradient(110deg,transparent_20%,rgba(96,165,250,0.12)_45%,transparent_70%)] bg-[length:200%_100%]"
        aria-hidden
      />
      <div className="relative space-y-3">
        <div className="hub-skeleton h-4 w-24" />
        <div className="hub-skeleton h-10 w-16" />
        <div className="hub-skeleton h-1 w-full" />
        <div className="hub-skeleton h-6 w-14" />
        <p className="pt-2 text-center text-[12px] font-medium text-[var(--hub-muted)]">
          Launching soon
        </p>
      </div>
    </div>
  );
}

function NarrativeCard({ item }: { item: AttentionDashboardItem }) {
  const badge = MOMENTUM_BADGE[item.momentum];
  const score = Math.round(item.attentionScore);
  const pct = momentumPct(item.attentionScore, item.scorePrev24h);
  const pctPositive = pct >= 0;

  return (
    <article
      className={cn(
        "group flex min-w-[220px] max-w-[220px] cursor-pointer flex-col rounded-2xl border border-[var(--hub-border)] bg-[var(--hub-card)] p-4",
        "transition duration-200 hover:-translate-y-0.5 hover:border-[var(--hub-primary)] hover:shadow-lg hover:shadow-[var(--hub-primary-glow)]",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="min-w-0 truncate text-[15px] font-semibold text-[var(--hub-fg)]">
          {item.narrativeName}
        </h3>
        <span
          className={cn(
            "shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ring-1",
            badge.className,
          )}
        >
          {badge.label}
        </span>
      </div>

      <div className="mt-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--hub-muted)]">
          Attention
        </p>
        <p className={cn("mt-1 text-[40px] font-bold leading-none tabular-nums", scoreColor(score))}>
          {score}
        </p>
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-black/30">
          <div
            className={cn("h-full rounded-full transition-all", scoreBarColor(score))}
            style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
          />
        </div>
      </div>

      <div className="mt-4">
        <p className="text-[11px] text-[var(--hub-muted)]">Conviction</p>
        <p className="mt-0.5 text-[20px] font-bold tabular-nums text-[var(--hub-fg)]">
          {Math.round(item.convictionScore)}
        </p>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 text-[12px]">
        <span className="text-[var(--hub-muted)]">Momentum</span>
        <span
          className={cn(
            "font-semibold tabular-nums",
            pctPositive ? "text-emerald-400" : "text-rose-400",
          )}
        >
          {pctPositive ? "+" : ""}
          {pct}%
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-[var(--hub-border)] pt-3 text-[11px] text-[var(--hub-muted)]">
        <span>Markets: {item.activeMarkets}</span>
        <span>Volume: {fmtUsdCompact(item.volume24hUsd)}</span>
      </div>

      <Link
        href={`/narratives/${encodeURIComponent(item.narrativeSlug)}`}
        className={cn(
          "mt-3 inline-flex w-full items-center justify-center rounded-lg border border-[var(--hub-border)] px-3 py-2",
          "text-[12px] font-semibold text-[var(--hub-fg)] transition",
          "hover:border-[var(--hub-primary)] hover:bg-white/[0.04]",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        View Narrative →
      </Link>
    </article>
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
    // Treat mock-only payloads as empty for the "Launching soon" empty state.
    const real = data.filter((row) => !row._isMock);
    const source = real.length > 0 ? real : data;
    // If API only returned mocks because DB was empty, still show them unless
    // the user wants "Launching soon" for true empty. Spec: empty = no narratives.
    // Mock rows from the API mean "no DB data" — use Launching soon for that.
    if (data.length > 0 && data.every((row) => row._isMock)) {
      return [];
    }
    return sortNarratives(source.slice(0, 8), sort);
  }, [query.data, sort]);

  const showEmpty = !query.isLoading && rows.length === 0;

  return (
    <section className="hub-section" aria-label="Trending Narratives">
      <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-[20px] font-semibold tracking-tight text-[var(--hub-fg)]">
            Trending Narratives
          </h2>
          <p className="mt-1 block text-[13px] text-[var(--hub-muted)]">
            Where attention is flowing right now
          </p>
        </div>

        <label className="relative inline-flex shrink-0 items-center">
          <span className="sr-only">Sort narratives</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className={cn(
              "appearance-none rounded-lg border border-[var(--hub-border)] bg-[var(--hub-card)]",
              "py-2 pl-3 pr-9 text-[13px] font-medium text-[var(--hub-fg)]",
              "focus:outline-none focus:ring-2 focus:ring-[var(--hub-primary)]/30",
            )}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-2.5 size-3.5 text-[var(--hub-muted)]"
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
        {query.isLoading && rows.length === 0
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="hub-skeleton min-h-[280px] min-w-[220px] max-w-[220px] rounded-2xl"
              />
            ))
          : showEmpty
            ? Array.from({ length: 4 }).map((_, i) => (
                <LaunchingPlaceholder key={i} />
              ))
            : rows.map((item) => <NarrativeCard key={item.id} item={item} />)}
      </div>
    </section>
  );
}
