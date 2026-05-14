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
  mergedUnderFeatured = false,
}: {
  markets: readonly Market[];
  index: number;
  onChange: (next: number) => void;
  /** Flush under featured card — shared chrome, no gap. */
  mergedUnderFeatured?: boolean;
}) {
  const n = markets.length;
  if (n === 0) return null;

  const prevM = markets[(index - 1 + n) % n]!;
  const nextM = markets[(index + 1) % n]!;

  return (
    <div
      className={cn(
        mergedUnderFeatured
          ? "border-t border-border/80 bg-gradient-to-b from-muted/25 via-card/40 to-muted/20 px-4 py-4 sm:px-5 sm:py-[1.15rem]"
          : "rounded-xl border border-border bg-gradient-to-b from-card via-card/95 to-muted/25 px-4 py-3.5 shadow-md ring-1 ring-border/40 sm:px-5 sm:py-4",
      )}
    >
      <p className="mb-3 font-mono text-[9.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground sm:mb-3.5">
        Spotlight queue
      </p>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-stretch sm:justify-between sm:gap-5">
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
                  ? "w-10 bg-primary shadow-[0_0_14px_color-mix(in_srgb,var(--primary)_22%,transparent)]"
                  : "w-2 bg-muted-foreground/35 ring-1 ring-border hover:bg-muted-foreground/55",
              )}
            />
          ))}
        </div>
        <div className="flex flex-wrap items-stretch justify-end gap-2 sm:min-w-0 sm:flex-1 sm:items-center">
          <button
            type="button"
            onClick={() => onChange((index - 1 + n) % n)}
            className="inline-flex max-w-full min-h-[42px] min-w-0 flex-1 items-center gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2.5 text-left font-mono text-[10.5px] font-medium leading-snug text-muted-foreground transition hover:border-border hover:bg-muted/40 hover:text-foreground sm:max-w-[min(100%,300px)] sm:flex-initial sm:py-3"
          >
            <ChevronLeft className="h-3.5 w-3.5 shrink-0 text-muted-foreground/80" aria-hidden />
            <span className="min-w-0 truncate">{truncTitle(prevM.title, 42)}</span>
          </button>
          <button
            type="button"
            onClick={() => onChange((index + 1) % n)}
            className="inline-flex max-w-full min-h-[42px] min-w-0 flex-1 items-center justify-end gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2.5 text-right font-mono text-[10.5px] font-medium leading-snug text-muted-foreground transition hover:border-border hover:bg-muted/40 hover:text-foreground sm:max-w-[min(100%,300px)] sm:flex-initial sm:py-3"
          >
            <span className="min-w-0 truncate">{truncTitle(nextM.title, 42)}</span>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/80" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
