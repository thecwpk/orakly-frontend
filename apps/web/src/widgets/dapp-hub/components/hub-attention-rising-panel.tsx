"use client";

import { cn } from "@/lib/utils";
import type { AttentionNarrativeRow } from "@/shared/contracts/hub-home";
import { fmtMomentum } from "../lib/format-hub-metrics";

function NarrativeLine({
  row,
  direction,
}: {
  row: AttentionNarrativeRow;
  direction: "up" | "down";
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[var(--hub-border)] py-2.5 last:border-b-0">
      <span className="min-w-0 truncate text-sm text-[var(--hub-fg)]">
        <span aria-hidden className="mr-1.5">
          {direction === "up" ? "🔥" : "📉"}
        </span>
        {row.narrative}
      </span>
      <span
        className={cn(
          "shrink-0 font-mono text-sm font-semibold tabular-nums",
          direction === "up" ? "text-[var(--hub-success)]" : "text-[var(--hub-danger)]",
        )}
      >
        {fmtMomentum(row.momentumPct)}
      </span>
    </div>
  );
}

export function HubAttentionRisingPanel({
  rows,
  loading,
  isFetching,
}: {
  rows: AttentionNarrativeRow[];
  loading: boolean;
  isFetching?: boolean;
}) {
  const rising = [...rows]
    .filter((r) => r.momentumPct > 0)
    .sort((a, b) => b.momentumPct - a.momentumPct)
    .slice(0, 6);
  const falling = [...rows]
    .filter((r) => r.momentumPct < 0)
    .sort((a, b) => a.momentumPct - b.momentumPct)
    .slice(0, 4);

  return (
    <div className="hub-card flex h-full min-h-[320px] flex-col p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--hub-muted)]">
          Top Rising Narratives
        </p>
        <span className="inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-[var(--hub-success)]">
          <span
            className={cn(
              "size-1.5 rounded-full bg-[var(--hub-success)]",
              isFetching && "animate-pulse",
            )}
          />
          Live
        </span>
      </div>

      {loading ? (
        <div className="flex flex-1 flex-col gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="hub-skeleton h-10 w-full" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-[var(--hub-muted)]">No attention data yet.</p>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto font-mono">
          {rising.map((r) => (
            <NarrativeLine key={`up-${r.narrative}`} row={r} direction="up" />
          ))}
          {falling.map((r) => (
            <NarrativeLine key={`down-${r.narrative}`} row={r} direction="down" />
          ))}
        </div>
      )}
    </div>
  );
}
