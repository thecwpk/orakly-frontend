"use client";

import { cn } from "@/lib/utils";
import { fmtPct } from "../lib/format-hub-metrics";

/** Horizontal probability lane — trader reads chance at a glance. */
export function HubProbabilityBar({
  probability,
  className,
  showLabel = true,
  size = "md",
}: {
  probability: number;
  className?: string;
  showLabel?: boolean;
  size?: "sm" | "md";
}) {
  const pct = Math.min(100, Math.max(0, probability * 100));
  const noPct = 100 - pct;

  return (
    <div className={cn("w-full", className)}>
      {showLabel ? (
        <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
          <span className="font-mono font-semibold tabular-nums text-[var(--hub-primary-bright)]">
            Yes {fmtPct(pct)}
          </span>
          <span className="font-mono tabular-nums text-[var(--hub-muted)]">No {fmtPct(noPct)}</span>
        </div>
      ) : null}
      <div
        className={cn(
          "flex overflow-hidden rounded-full bg-[rgba(15,30,55,0.9)] ring-1 ring-[var(--hub-border)]",
          size === "sm" ? "h-1.5" : "h-2",
        )}
      >
        <div
          className="h-full bg-gradient-to-r from-[var(--hub-primary)] to-[#38bdf8] transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
        <div className="h-full flex-1 bg-[rgba(248,113,113,0.35)]" style={{ width: `${noPct}%` }} />
      </div>
    </div>
  );
}
