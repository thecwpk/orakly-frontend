"use client";

import { useAttentionDashboardQuery } from "@/shared/api/hooks";
import type { AttentionNarrativeRow } from "@/shared/contracts/hub-home";
import { cn } from "@/lib/utils";
import { fmtMomentum } from "../lib/format-hub-metrics";
import { HubSectionShell } from "./hub-section-shell";

function isAccelerating(row: AttentionNarrativeRow): boolean {
  return row.trend === "RISING" && row.momentumPct >= 8;
}

function groupLabel(kind: string): string {
  switch (kind) {
    case "accelerating":
      return "🔥 Accelerating";
    case "rising":
      return "⚡ Rising";
    case "stable":
      return "➖ Stable";
    case "cooling":
      return "📉 Cooling";
    default:
      return kind;
  }
}

export function HubAttentionDashboard() {
  const attentionQ = useAttentionDashboardQuery();
  const rows = attentionQ.data ?? [];

  const accelerating = rows.filter(isAccelerating);
  const rising = rows.filter((r) => r.trend === "RISING" && !isAccelerating(r));
  const stable = rows.filter((r) => r.trend === "STABLE");
  const cooling = rows.filter((r) => r.trend === "COOLING");

  const groups = [
    { id: "accelerating", items: accelerating },
    { id: "rising", items: rising },
    { id: "stable", items: stable },
    { id: "cooling", items: cooling },
  ] as const;

  return (
    <HubSectionShell
      id="attention"
      className="hub-section--mobile-reorder-attention"
      title="Attention Dashboard"
      subtitle="Why is attention moving?"
    >
      <div className="grid gap-[var(--hub-card-gap)] lg:grid-cols-2">
        <div className="hub-card p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--hub-muted)]">
            Top Narratives
          </p>
          {attentionQ.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="hub-skeleton h-8 w-full" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <p className="text-sm text-[var(--hub-muted)]">No narratives tracked.</p>
          ) : (
            <ul className="divide-y divide-[var(--hub-border)]">
              {[...rows]
                .sort((a, b) => b.score - a.score)
                .map((r, i) => (
                  <li
                    key={r.narrative}
                    className="flex items-center justify-between gap-3 py-2.5 text-sm"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="w-5 font-mono text-xs text-[var(--hub-muted)]">
                        {i + 1}
                      </span>
                      <span className="truncate font-medium text-[var(--hub-fg)]">
                        {r.narrative}
                      </span>
                    </span>
                    <span className="shrink-0 font-mono text-xs tabular-nums text-[var(--hub-muted)]">
                      {Math.round(r.score)}{" "}
                      <span
                        className={cn(
                          r.momentumPct >= 0
                            ? "text-[var(--hub-success)]"
                            : "text-[var(--hub-danger)]",
                        )}
                      >
                        {fmtMomentum(r.momentumPct)}
                      </span>
                    </span>
                  </li>
                ))}
            </ul>
          )}
        </div>

        <div className="hub-card p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--hub-muted)]">
            Momentum Groups
          </p>
          {attentionQ.isLoading ? (
            <div className="hub-skeleton h-48 w-full" />
          ) : (
            <div className="space-y-4">
              {groups.map((g) => (
                <div key={g.id}>
                  <p className="text-xs font-medium text-[var(--hub-fg)]">{groupLabel(g.id)}</p>
                  <p className="mt-1 text-sm text-[var(--hub-muted)]">
                    {g.items.length === 0
                      ? "No narratives"
                      : g.items.map((r) => r.narrative).join(", ")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </HubSectionShell>
  );
}
