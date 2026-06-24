"use client";

import type { Market } from "@orakly/types";
import { Activity, Database, Zap } from "lucide-react";
import { useMemo } from "react";
import { formatCompactUsd } from "@orakly/utils";
import { useSocketRegistry } from "@/websocket/socket-registry";
import { cn } from "@/lib/utils";

function tapeSkewVol(markets: readonly Market[]): { skewPct: number; vol: number } {
  let vwYes = 0;
  let vwNo = 0;
  let t = 0;
  for (const m of markets) {
    const v = m.volumeUsd ?? 0;
    if (!Number.isFinite(v) || v <= 0) continue;
    t += v;
    vwYes += v * (m.probability ?? 0.5);
    vwNo += v * (1 - (m.probability ?? 0.5));
  }
  if (!t) return { skewPct: 50, vol: 0 };
  const yShare = vwYes / (vwYes + vwNo || 1);
  return { skewPct: Math.round(yShare * 100), vol: t };
}

type Props = {
  /** Markets in the active lens (filtered category + search) — drives skew. */
  lensMarkets: readonly Market[];
  totalLoaded: number;
  liveCount: number;
  updatedLabel: string | null;
  isFetching: boolean;
  isLoading?: boolean;
};

/**
 * Single dense strip: tape health + lens skew bar (volume-weighted YES bias).
 */
export function MarketsExplorerDiscoveryStrip({
  lensMarkets,
  totalLoaded,
  liveCount,
  updatedLabel,
  isFetching,
  isLoading,
}: Props) {
  const { connectionStatus } = useSocketRegistry();

  const feedLabel = useMemo(() => {
    if (connectionStatus === "connected") return "Live tape";
    if (connectionStatus === "connecting") return "Syncing…";
    if (connectionStatus === "error") return "Reconnecting";
    return "Idle";
  }, [connectionStatus]);

  const feedTone =
    connectionStatus === "connected"
      ? "text-[var(--hub-success)]"
      : connectionStatus === "connecting" || connectionStatus === "error"
        ? "text-amber-300"
        : "text-[var(--hub-muted)]";

  const { skewPct, vol } = useMemo(() => tapeSkewVol(lensMarkets), [lensMarkets]);

  return (
    <div
      className={cn(
        "flex flex-col gap-1 border-t border-[var(--hub-border)] bg-[var(--hub-bg-subtle)]/80 px-2 py-1.5",
        "supports-[backdrop-filter]:backdrop-blur-sm",
      )}
      aria-label="Discovery status and lens sentiment"
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--hub-muted)]">
        <span className="inline-flex items-center gap-1">
          <Database className="h-3 w-3 opacity-70" aria-hidden />
          <span className="font-mono tabular-nums text-[var(--hub-fg)]">
            {isLoading ? "—" : totalLoaded}
          </span>
          <span className="normal-case tracking-normal opacity-80">loaded</span>
        </span>

        <span className="hidden h-3 w-px bg-[var(--hub-border)] sm:block" aria-hidden />

        <span className="inline-flex items-center gap-1">
          <Zap className="h-3 w-3 text-[var(--hub-primary-bright)]" aria-hidden />
          <span className="font-mono tabular-nums text-[var(--hub-fg)]">{liveCount}</span>
          <span className="normal-case tracking-normal opacity-80">live</span>
        </span>

        <span className="hidden h-3 w-px bg-[var(--hub-border)] md:block" aria-hidden />

        <span className={cn("inline-flex items-center gap-1", feedTone)}>
          <Activity className="h-3 w-3" aria-hidden />
          <span className="normal-case tracking-normal">{feedLabel}</span>
        </span>

        <span className="ml-auto inline-flex items-center gap-1 normal-case tracking-normal">
          <span className="opacity-70">HTTP</span>
          <span
            className={cn(
              "font-mono text-[10px] tabular-nums text-[var(--hub-muted)]",
              isFetching && "text-[var(--hub-primary-bright)]",
            )}
          >
            {updatedLabel ? `Δ ${updatedLabel}` : "—"}
          </span>
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="shrink-0 text-[9px] font-semibold uppercase tracking-[0.14em] text-[var(--hub-muted)]">
          Lens skew
        </span>
        <div className="flex h-1.5 min-w-[120px] flex-1 overflow-hidden rounded-full bg-[var(--hub-track-bg)]">
          <div
            className="h-full shrink-0 rounded-l-full bg-gradient-to-r from-[var(--hub-primary)] to-[var(--hub-success)]"
            style={{ width: `${skewPct}%` }}
          />
          <div className="h-full min-w-0 flex-1 rounded-r-full bg-gradient-to-l from-[var(--hub-danger)] to-amber-500/60" />
        </div>
        <span className="font-mono text-[10px] tabular-nums text-[var(--hub-muted)]">
          <span className="text-[var(--hub-primary-bright)]">{skewPct}%</span>
          <span className="opacity-50"> · </span>
          <span>{formatCompactUsd(vol)}</span>
          <span className="opacity-50"> vol</span>
        </span>
      </div>
    </div>
  );
}
