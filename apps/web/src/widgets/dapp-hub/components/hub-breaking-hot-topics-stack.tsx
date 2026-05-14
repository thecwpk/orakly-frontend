"use client";

import { useMemo } from "react";
import { formatCompactUsd } from "@orakly/utils";
import { PrefetchLink } from "@/shared/ui";
import { ChevronRight, Flame, TrendingDown, TrendingUp, Zap } from "lucide-react";
import type { Market } from "@orakly/types";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/shared/constants/routes";

function fmtUsdToday(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "—";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M today`;
  if (n >= 10_000) return `$${(n / 1_000).toFixed(0)}k today`;
  return `$${Math.round(n).toLocaleString()} today`;
}

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

function pickHotRows(markets: readonly Market[], take: number): Market[] {
  return markets.slice(0, take);
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

function HotMarketCard({ market: m }: { market: Market }) {
  const yes = Math.round((m.probability ?? 0.5) * 100);

  return (
    <PrefetchLink
      href={ROUTES.market(m.slug)}
      className={cn(
        "group relative block overflow-hidden rounded-xl border border-border/90 bg-gradient-to-br from-card/50 via-card/30 to-no/[0.06] p-3 pl-3.5 shadow-sm ring-1 ring-border/30 transition",
        "hover:border-no/30 hover:from-muted/20 hover:to-no/[0.09] hover:shadow-md",
      )}
    >
      <div
        className="pointer-events-none absolute bottom-0 left-0 top-0 w-0.5 bg-gradient-to-b from-no/50 via-no/35 to-transparent opacity-80"
        aria-hidden
      />
      <div className="flex gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-no/10 ring-1 ring-no/25">
          <Flame className="size-5 text-no/90" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-1 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {m.category}
          </p>
          <p className="mt-1 line-clamp-2 text-[13px] font-semibold leading-snug tracking-tight text-foreground group-hover:text-no/95">
            {m.title}
          </p>
          <p className="mt-2 font-mono text-[10px] font-medium tabular-nums text-muted-foreground">{fmtUsdToday(m.volumeUsd)}</p>
          <OddsStrip yes={yes} />
        </div>
        <ChevronRight className="mt-1 size-4 shrink-0 self-center text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" aria-hidden />
      </div>
    </PrefetchLink>
  );
}

export function HubBreakingHotTopicsStack({
  breakingMarkets,
  hotMarkets,
  excludeId,
  liveSet,
  loadingBreaking,
  loadingHot,
  breakingTake = 5,
  hotTake = 5,
  className,
}: {
  breakingMarkets: readonly Market[];
  hotMarkets: readonly Market[];
  excludeId?: string;
  liveSet: ReadonlySet<string>;
  loadingBreaking?: boolean;
  loadingHot?: boolean;
  breakingTake?: number;
  hotTake?: number;
  className?: string;
}) {
  const breakingRows = useMemo(
    () => pickBreakingRows(breakingMarkets, excludeId, breakingTake),
    [breakingMarkets, excludeId, breakingTake],
  );
  const hotRows = useMemo(() => pickHotRows(hotMarkets, hotTake), [hotMarkets, hotTake]);

  const wrap = cn("relative flex min-h-0 flex-col overflow-hidden", className);

  return (
    <div className={wrap}>
      <div className="px-3 pb-1 pt-3.5 sm:px-3.5">
        <PrefetchLink
          href={ROUTES.marketsTrending}
          className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-transparent px-1 py-1 transition hover:border-border/80 hover:bg-muted/25"
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yes/12 ring-1 ring-yes/25">
              <Zap className="size-[18px] text-yes" aria-hidden />
            </span>
            <span className="text-[14px] font-semibold leading-none tracking-tight text-foreground">Breaking news</span>
          </div>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        </PrefetchLink>

        {loadingBreaking && !breakingRows.length ? (
          <ul className="flex flex-col gap-2.5" aria-busy>
            {Array.from({ length: breakingTake }).map((_, i) => (
              <li key={i}>
                <div className="h-[104px] animate-pulse rounded-xl bg-muted/45 ring-1 ring-border/30" />
              </li>
            ))}
          </ul>
        ) : !breakingRows.length ? (
          <p className="py-8 text-center font-mono text-[10px] text-muted-foreground">Tape warming…</p>
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

      <div className="mx-3 h-px bg-gradient-to-r from-transparent via-border to-transparent sm:mx-3.5" aria-hidden />

      <div className="bg-muted/[0.06] px-3 pb-3.5 pt-3.5 sm:px-3.5">
        <PrefetchLink
          href={ROUTES.markets}
          className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-transparent px-1 py-1 transition hover:border-border/80 hover:bg-muted/30"
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-no/10 ring-1 ring-no/22">
              <Flame className="size-[18px] text-no/90" aria-hidden />
            </span>
            <span className="text-[14px] font-semibold leading-none tracking-tight text-foreground">Hot topics</span>
          </div>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        </PrefetchLink>

        {loadingHot && !hotRows.length ? (
          <ul className="flex flex-col gap-2.5" aria-busy>
            {Array.from({ length: hotTake }).map((_, i) => (
              <li key={i}>
                <div className="h-[104px] animate-pulse rounded-xl bg-muted/45 ring-1 ring-border/30" />
              </li>
            ))}
          </ul>
        ) : !hotRows.length ? (
          <p className="py-6 text-center font-mono text-[9.5px] leading-relaxed text-muted-foreground">
            Cross-lane topics appear when hub feeds overlap — syncing…
          </p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {hotRows.map((m) => (
              <li key={m.id}>
                <HotMarketCard market={m} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
