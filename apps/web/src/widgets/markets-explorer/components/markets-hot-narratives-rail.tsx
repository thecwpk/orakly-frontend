"use client";

import type { Market } from "@orakly/types";
import { Flame } from "lucide-react";
import Link from "next/link";
import { ROUTES } from "@/shared/constants/routes";
import { cn } from "@/lib/utils";

function fmtVol(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "—";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 10_000) return `$${(n / 1_000).toFixed(1)}k`;
  return `$${Math.round(n)}`;
}

/** Highest-volume venues — quick jumps without leaving the explorer chrome. */
export function MarketsHotNarrativesRail({ markets }: { markets: Market[] }) {
  if (!markets.length) return null;

  return (
    <section
      className={cn(
        "rounded-lg border border-white/[0.06] bg-[#07070d]/80 px-2 py-2 ring-1 ring-white/[0.05]",
        "backdrop-blur-sm supports-[backdrop-filter]:bg-[#07070d]/65",
      )}
    >
      <div className="mb-1 flex items-center justify-between gap-2 px-0.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <Flame className="h-3 w-3 shrink-0 text-orange-400/95" aria-hidden />
          <span className="truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
            Hot narratives
          </span>
          <span className="hidden shrink-0 font-mono text-[9px] text-zinc-600 sm:inline">
            · vol leaders
          </span>
        </div>
      </div>
      <div className="flex gap-1 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:thin] snap-x">
        {markets.map((m) => (
          <Link
            key={m.id}
            href={ROUTES.market(m.slug)}
            prefetch
            className={cn(
              "snap-start shrink-0 max-w-[min(260px,72vw)] rounded-md bg-white/[0.035] py-1 pl-2 pr-2",
              "ring-1 ring-white/[0.06] transition hover:bg-white/[0.06] hover:ring-cyan-400/20",
            )}
          >
            <p className="truncate text-[11px] font-medium leading-tight text-zinc-200">{m.title}</p>
            <div className="mt-0.5 flex items-center gap-2 font-mono text-[9px] tabular-nums text-zinc-500">
              <span className="text-cyan-400/90">{Math.round(m.probability * 100)}¢</span>
              <span>{fmtVol(m.volumeUsd ?? 0)}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
