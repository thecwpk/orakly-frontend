"use client";

import type { Market } from "@orakly/types";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

function truncTitle(s: string, n: number) {
  return s.length <= n ? s : `${s.slice(0, Math.max(0, n - 1))}…`;
}

export function HubSpotlightCarouselNav({
  markets,
  index,
  onChange,
}: {
  markets: readonly Market[];
  index: number;
  onChange: (next: number) => void;
}) {
  const n = markets.length;
  if (n === 0) return null;

  const prevM = markets[(index - 1 + n) % n]!;
  const nextM = markets[(index + 1) % n]!;

  return (
    <div className="rounded-xl border border-white/[0.07] bg-gradient-to-b from-zinc-950/75 to-black/55 px-4 py-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] ring-1 ring-white/[0.03] sm:px-5 sm:py-4">
      <p className="mb-3 font-mono text-[9px] font-medium uppercase tracking-[0.14em] text-zinc-600">Spotlight queue</p>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-5">
        <div className="flex items-center gap-2" role="tablist" aria-label="Featured markets carousel">
          {markets.map((_, i) => (
            <button
              key={markets[i]!.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Slide ${i + 1} of ${n}`}
              onClick={() => onChange(i)}
              className={cn(
                "h-2 shrink-0 rounded-full transition-all duration-300",
                i === index
                  ? "w-10 bg-white shadow-[0_0_12px_rgba(255,255,255,0.12)]"
                  : "w-2 bg-zinc-700 ring-1 ring-white/[0.06] hover:bg-zinc-500",
              )}
            />
          ))}
        </div>
        <div className="flex flex-wrap items-stretch justify-end gap-2 sm:min-w-0 sm:flex-1">
          <button
            type="button"
            onClick={() => onChange((index - 1 + n) % n)}
            className="inline-flex max-w-full min-w-0 flex-1 items-center gap-2 rounded-lg border border-white/[0.09] bg-white/[0.04] px-3 py-2.5 text-left font-mono text-[10px] font-medium leading-snug text-zinc-400 transition hover:border-white/[0.15] hover:bg-white/[0.06] hover:text-zinc-100 sm:max-w-[min(100%,260px)] sm:flex-initial"
          >
            <ChevronLeft className="h-3.5 w-3.5 shrink-0 text-zinc-500" aria-hidden />
            <span className="min-w-0 truncate">{truncTitle(prevM.title, 36)}</span>
          </button>
          <button
            type="button"
            onClick={() => onChange((index + 1) % n)}
            className="inline-flex max-w-full min-w-0 flex-1 items-center justify-end gap-2 rounded-lg border border-white/[0.09] bg-white/[0.04] px-3 py-2.5 text-right font-mono text-[10px] font-medium leading-snug text-zinc-400 transition hover:border-white/[0.15] hover:bg-white/[0.06] hover:text-zinc-100 sm:max-w-[min(100%,260px)] sm:flex-initial"
          >
            <span className="min-w-0 truncate">{truncTitle(nextM.title, 36)}</span>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-zinc-500" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
