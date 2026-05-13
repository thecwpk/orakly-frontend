"use client";

import { useMemo } from "react";
import { PrefetchLink } from "@/shared/ui";
import { ChevronRight, Flame, TrendingDown, TrendingUp } from "lucide-react";
import type { Market } from "@orakly/types";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/shared/constants/routes";
import { hubHotTopicShortLabel } from "./hub-hot-topics-lane-slider";

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

  const wrap = cn(
    "overflow-hidden rounded-lg border border-white/[0.06] bg-black/25 ring-1 ring-white/[0.04]",
    className,
  );

  return (
    <div className={wrap}>
      {/* Breaking */}
      <div className="px-3 pt-3">
        <PrefetchLink
          href={ROUTES.marketsTrending}
          className="mb-1 flex items-center justify-between gap-2 rounded-md py-1.5 text-left transition hover:bg-white/[0.03]"
        >
          <span className="text-[13px] font-semibold leading-none tracking-tight text-zinc-50">Breaking news</span>
          <ChevronRight className="size-4 shrink-0 text-zinc-500" aria-hidden />
        </PrefetchLink>

        {loadingBreaking && !breakingRows.length ? (
          <ul className="divide-y divide-white/[0.06]">
            {Array.from({ length: breakingTake }).map((_, i) => (
              <li key={i} className="py-3.5">
                <div className="h-4 animate-pulse rounded bg-white/[0.06]" />
              </li>
            ))}
          </ul>
        ) : !breakingRows.length ? (
          <p className="py-6 text-center font-mono text-[10px] text-zinc-500">Tape warming…</p>
        ) : (
          <ul className="divide-y divide-white/[0.06]">
            {breakingRows.map((m, i) => {
              const yes = Math.round((m.probability ?? 0.5) * 100);
              const no = 100 - yes;
              const live = liveSet.has(m.id);
              const leanYes = (m.probability ?? 0.5) >= 0.5;
              return (
                <li key={m.id}>
                  <PrefetchLink
                    href={ROUTES.market(m.slug)}
                    className="grid w-full grid-cols-[1.25rem_minmax(0,1fr)_4.25rem] items-center gap-x-2.5 py-3.5 text-left transition hover:bg-white/[0.03] sm:grid-cols-[1.5rem_minmax(0,1fr)_4.5rem] sm:gap-x-3"
                  >
                    <span className="font-mono text-[11px] tabular-nums text-zinc-500">{i + 1}</span>
                    <span className="min-w-0 line-clamp-2 text-[12px] font-medium leading-snug text-zinc-100">{m.title}</span>
                    <div className="flex flex-col items-end justify-center gap-1">
                      <span className="text-[13px] font-semibold tabular-nums leading-none text-zinc-50">{yes}%</span>
                      <div className="flex items-center gap-0.5 font-mono text-[10px] tabular-nums leading-none text-zinc-500">
                        {leanYes ? (
                          <TrendingUp className="size-3 shrink-0 text-emerald-400/95" aria-hidden />
                        ) : (
                          <TrendingDown className="size-3 shrink-0 text-rose-400/95" aria-hidden />
                        )}
                        <span>{no}%</span>
                      </div>
                      {live ? (
                        <span className="rounded px-1 py-px text-[7px] font-semibold uppercase tracking-wide text-emerald-300/95 ring-1 ring-emerald-500/35">
                          Live
                        </span>
                      ) : null}
                    </div>
                  </PrefetchLink>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="mx-3 border-t border-dotted border-white/[0.12]" aria-hidden />

      {/* Hot topics */}
      <div className="px-3 pb-3 pt-2">
        <PrefetchLink
          href={ROUTES.markets}
          className="mb-1 flex items-center justify-between gap-2 rounded-md py-1.5 text-left transition hover:bg-white/[0.03]"
        >
          <span className="text-[13px] font-semibold leading-none tracking-tight text-zinc-50">Hot topics</span>
          <ChevronRight className="size-4 shrink-0 text-zinc-500" aria-hidden />
        </PrefetchLink>

        {loadingHot && !hotRows.length ? (
          <ul className="divide-y divide-white/[0.06]">
            {Array.from({ length: hotTake }).map((_, i) => (
              <li key={i} className="py-3.5">
                <div className="h-4 animate-pulse rounded bg-white/[0.06]" />
              </li>
            ))}
          </ul>
        ) : !hotRows.length ? (
          <p className="py-5 text-center font-mono text-[9.5px] leading-relaxed text-zinc-500">
            Cross-lane topics appear when hub feeds overlap — syncing…
          </p>
        ) : (
          <ul className="divide-y divide-white/[0.06]">
            {hotRows.map((m, i) => {
              const label = hubHotTopicShortLabel(m);
              return (
                <li key={m.id}>
                  <PrefetchLink
                    href={ROUTES.market(m.slug)}
                    className="grid w-full grid-cols-[1.25rem_minmax(0,1fr)_auto] items-center gap-x-2 py-3.5 text-left transition hover:bg-white/[0.03] sm:grid-cols-[1.5rem_minmax(0,1fr)_auto] sm:gap-x-3"
                  >
                    <span className="font-mono text-[11px] tabular-nums text-zinc-500">{i + 1}</span>
                    <span className="min-w-0 truncate text-[12px] font-medium text-zinc-100">{label}</span>
                    <div className="flex min-w-0 shrink-0 items-center gap-2">
                      <span className="max-w-[7rem] truncate font-mono text-[10px] tabular-nums text-zinc-500 sm:max-w-none">
                        {fmtUsdToday(m.volumeUsd)}
                      </span>
                      <Flame className="size-3.5 shrink-0 text-rose-500/85" aria-hidden />
                      <ChevronRight className="size-4 shrink-0 text-zinc-600" aria-hidden />
                    </div>
                  </PrefetchLink>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
