"use client";

import { Activity, Database, Zap } from "lucide-react";
import { useMemo } from "react";
import { useSocketRegistry } from "@/websocket/socket-registry";
import { cn } from "@/lib/utils";

type Props = {
  totalMarkets: number;
  liveCount: number;
  updatedLabel: string | null;
  isFetching: boolean;
};

/**
 * Dexscreener-style status strip — communicates freshness + socket health at a glance.
 */
export function DiscoveryStatusTape({
  totalMarkets,
  liveCount,
  updatedLabel,
  isFetching,
}: Props) {
  const { connectionStatus } = useSocketRegistry();

  const feedLabel = useMemo(() => {
    if (connectionStatus === "connected") return "Live feed";
    if (connectionStatus === "connecting") return "Syncing feed…";
    if (connectionStatus === "error") return "Reconnecting…";
    return "Idle";
  }, [connectionStatus]);

  const tone =
    connectionStatus === "connected"
      ? "text-emerald-300"
      : connectionStatus === "connecting" || connectionStatus === "error"
        ? "text-amber-300"
        : "text-[var(--hub-muted)]";

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-[var(--hub-border)] bg-[var(--hub-bg-subtle)] px-2 py-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--hub-muted)]",
      )}
      aria-label="Market discovery status"
    >
      <span className="inline-flex items-center gap-1.5">
        <Database className="h-3 w-3 text-[var(--hub-muted)]" aria-hidden />
        <span className="font-mono tabular-nums text-[var(--hub-fg)]">{totalMarkets}</span>
        <span className="normal-case tracking-normal text-[var(--hub-muted)]">loaded</span>
      </span>

      <span className="hidden h-3 w-px bg-[var(--hub-border)] sm:block" aria-hidden />

      <span className="inline-flex items-center gap-1.5">
        <Zap className="h-3 w-3 text-[var(--hub-primary-bright)]" aria-hidden />
        <span className="font-mono tabular-nums text-[var(--hub-fg)]/90">{liveCount}</span>
        <span className="normal-case tracking-normal text-[var(--hub-muted)]">live now</span>
      </span>

      <span className="hidden h-3 w-px bg-[var(--hub-border)] md:block" aria-hidden />

      <span className={cn("inline-flex items-center gap-1.5", tone)}>
        <Activity className="h-3 w-3" aria-hidden />
        <span className="normal-case tracking-normal">{feedLabel}</span>
      </span>

      <span className="ml-auto inline-flex items-center gap-1.5 normal-case tracking-normal">
        <span className="text-[var(--hub-muted)]">HTTP</span>
        <span
          className={cn(
            "font-mono text-[10px] tabular-nums text-[var(--hub-fg)]/80",
            isFetching && "text-[var(--hub-primary-bright)]",
          )}
        >
          {updatedLabel ? `Δ ${updatedLabel}` : "N/A"}
        </span>
      </span>
    </div>
  );
}
