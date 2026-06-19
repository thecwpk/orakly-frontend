"use client";

import type { AttentionNarrativeRow } from "@/shared/contracts/hub-home";
import { cn } from "@/lib/utils";
import { fmtMomentum } from "../lib/format-hub-metrics";

/** Horizontal bar chart — narrative momentum at a glance. */
export function HubMomentumBars({
  rows,
  loading,
  maxItems = 8,
  className,
}: {
  rows: AttentionNarrativeRow[];
  loading?: boolean;
  maxItems?: number;
  className?: string;
}) {
  const sorted = [...rows]
    .sort((a, b) => Math.abs(b.momentumPct) - Math.abs(a.momentumPct))
    .slice(0, maxItems);

  const maxAbs = Math.max(1, ...sorted.map((r) => Math.abs(r.momentumPct)));

  if (loading) {
    return (
      <div className={cn("space-y-2.5", className)}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="hub-skeleton h-7 w-full rounded-md" />
        ))}
      </div>
    );
  }

  if (sorted.length === 0) {
    return (
      <div className={cn("hub-skeleton h-24 w-full rounded-[var(--hub-radius)]", className)} />
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {sorted.map((row) => {
        const positive = row.momentumPct >= 0;
        const width = `${Math.max(8, (Math.abs(row.momentumPct) / maxAbs) * 100)}%`;
        return (
          <div key={row.narrative} className="grid grid-cols-[4.5rem_1fr_3rem] items-center gap-2">
            <span className="truncate text-xs font-semibold text-[var(--hub-fg)]">
              {row.narrative}
            </span>
            <div className="relative h-2 overflow-hidden rounded-full bg-[rgba(15,30,55,0.85)] ring-1 ring-[var(--hub-border)]">
              <div
                className={cn(
                  "absolute top-0 h-full rounded-full transition-[width] duration-500",
                  positive
                    ? "left-0 bg-gradient-to-r from-[var(--hub-success)] to-[#6ee7b7]"
                    : "right-0 bg-gradient-to-l from-[var(--hub-danger)] to-[#fca5a5]",
                )}
                style={{ width }}
              />
            </div>
            <span
              className={cn(
                "text-right font-mono text-[11px] font-semibold tabular-nums",
                positive ? "text-[var(--hub-success)]" : "text-[var(--hub-danger)]",
              )}
            >
              {fmtMomentum(row.momentumPct)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
