"use client";

import { useMemo } from "react";
import { formatCompactUsd } from "@orakly/utils";
import { PrefetchLink } from "@/shared/ui";
import { ChevronRight, TrendingDown, TrendingUp, Zap } from "lucide-react";
import type { Market } from "@orakly/types";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/shared/constants/routes";

function pickBreakingRows(markets: readonly Market[], excludeId: string | undefined, take: number): Market[] {
  const seen = new Set<string>();
  const out: Market[] = [];
  for (const m of markets) {
    if (excludeId && m.id === excludeId) continue;
    if (seen.has(m.id)) continue;
    seen.add(m.id);
    out.push(m);
    if (out.length >= take) break;
  }
  return out;
}

function HubSideGlyph({ category, title }: { category: string; title: string }) {
  const letter = (category.trim().slice(0, 1) || title.trim().slice(0, 1) || "?").toUpperCase();
  return (
    <div
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-muted to-muted/60 text-[13px] font-bold tracking-tight text-foreground shadow-sm ring-1 ring-border"
      aria-hidden
    >
      {letter}
    </div>
  );
}

function OddsStrip({ yes }: { yes: number }) {
  const no = 100 - yes;
  return (
    <div className="mt-2.5 space-y-1">
      <div className="flex h-1.5 overflow-hidden rounded-full bg-muted/90 ring-1 ring-border/40" title={`YES ${yes}% · NO ${no}%`}>
        <div className="bg-yes shadow-[0_0_12px_color-mix(in_srgb,var(--yes)_35%,transparent)]" style={{ width: `${yes}%` }} />
        <div className="min-w-0 flex-1 bg-no/25" />
      </div>
      <div className="flex items-center justify-between font-mono text-[10px] tabular-nums leading-none">
        <span className="font-semibold text-yes">YES {yes}%</span>
        <span className="text-no/90">NO {no}%</span>
      </div>
    </div>
  );
}

function BreakingMarketCard({
  market: m,
  live,
}: {
  market: Market;
  live: boolean;
}) {
  const yes = Math.round((m.probability ?? 0.5) * 100);
  const no = 100 - yes;
  const leanYes = (m.probability ?? 0.5) >= 0.5;
  const vol = formatCompactUsd(m.volumeUsd ?? 0);

  return (
    <PrefetchLink
      href={ROUTES.market(m.slug)}
      className={cn(
        "group relative block overflow-hidden rounded-xl border border-border/90 bg-card/40 p-3 shadow-sm ring-1 ring-border/30 transition",
        "hover:border-yes/35 hover:bg-muted/25 hover:shadow-md hover:ring-yes/15",
      )}
    >
      <div className="flex gap-3">
        <HubSideGlyph category={m.category} title={m.title} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="line-clamp-1 min-w-0 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {m.category}
            </p>
            {live ? (
              <span className="shrink-0 rounded-md bg-yes/15 px-1.5 py-0.5 font-mono text-[8px] font-semibold uppercase tracking-wide text-yes ring-1 ring-yes/30">
                Live
              </span>
            ) : null}
          </div>
          <p className="mt-1 line-clamp-2 text-[13px] font-semibold leading-snug tracking-tight text-foreground group-hover:text-yes/95">
            {m.title}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[10px] text-muted-foreground">
            <span className="tabular-nums">Vol {vol}</span>
            <span className="text-muted-foreground/50" aria-hidden>
              ·
            </span>
            <span className="inline-flex items-center gap-0.5 tabular-nums">
              {leanYes ? <TrendingUp className="size-3 text-yes" aria-hidden /> : <TrendingDown className="size-3 text-no" aria-hidden />}
              <span className="text-foreground/90">{yes}%</span>
              <span className="text-muted-foreground/80">/{no}%</span>
            </span>
          </div>
          <OddsStrip yes={yes} />
        </div>
      </div>
    </PrefetchLink>
  );
}

/** Breaking rail — live-signal scan with Polymarket-style “see all” destination. */
export function HubBreakingNewsPanel({
  breakingMarkets,
  excludeId,
  liveSet,
  loadingBreaking,
  breakingTake = 5,
  railMode = "live_signals",
  moreHref,
  className,
}: {
  breakingMarkets: readonly Market[];
  excludeId?: string;
  liveSet: ReadonlySet<string>;
  loadingBreaking?: boolean;
  breakingTake?: number;
  /** `live_signals`: server `filter=breaking`. `liquidity_movers`: fallback 24h volume rail. `movers_24h`: snapshot delta rank (flag-gated). */
  railMode?: "live_signals" | "liquidity_movers" | "movers_24h";
  /** Canonical “see all” route (default `/markets/breaking`). */
  moreHref?: string;
  className?: string;
}) {
  const seeAllHref = moreHref ?? ROUTES.marketsBreaking;
  const subtitle =
    railMode === "live_signals"
      ? "Live signal feed · markets with fresh upstream tape"
      : railMode === "movers_24h"
        ? "24h odds movers · ranked from snapshot mid vs current mid"
        : "24h liquidity movers · shown when no linked signals yet";
  const breakingRows = useMemo(
    () => pickBreakingRows(breakingMarkets, excludeId, breakingTake),
    [breakingMarkets, excludeId, breakingTake],
  );

  return (
    <div className={cn("mb-breaking-panel relative flex h-full min-h-0 flex-col overflow-hidden", className)}>
      <div className="shrink-0 px-2.5 pb-1 pt-3 sm:px-3">
        <PrefetchLink
          href={seeAllHref}
          className="mb-2.5 flex items-center justify-between gap-3 rounded-xl border border-transparent px-1 py-1 transition hover:border-border/80 hover:bg-muted/25"
        >
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <div className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yes/12 ring-1 ring-yes/25">
                <Zap className="size-[18px] text-yes" aria-hidden />
              </span>
              <span className="text-[14px] font-semibold leading-none tracking-tight text-foreground">Breaking</span>
            </div>
            <p className="pl-[3.25rem] text-[10px] font-medium leading-snug text-muted-foreground">{subtitle}</p>
          </div>
          <ChevronRight className="size-4 shrink-0 self-start text-muted-foreground" aria-hidden />
        </PrefetchLink>
      </div>

      <div className="mb-breaking-panel__scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-2.5 pb-3 sm:px-3">
        {loadingBreaking && !breakingRows.length ? (
          <ul className="flex flex-col gap-2.5" aria-busy>
            {Array.from({ length: breakingTake }).map((_, i) => (
              <li key={i}>
                <div className="h-[104px] animate-pulse rounded-xl bg-muted/45 ring-1 ring-border/30" />
              </li>
            ))}
          </ul>
        ) : !breakingRows.length ? (
          <p className="py-8 text-center font-mono text-[10px] text-muted-foreground">
            {railMode === "live_signals"
              ? "Linked signals appear when crypto tape is ingested."
              : railMode === "movers_24h"
                ? "Sampling odds snapshots — run the cron sampler or wait for the next interval."
                : "Tape warming…"}
          </p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {breakingRows.map((m) => (
              <li key={m.id}>
                <BreakingMarketCard market={m} live={liveSet.has(m.id)} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
