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
    if (connectionStatus === "connected") return "Live tape";
    if (connectionStatus === "connecting") return "Syncing tape…";
    if (connectionStatus === "error") return "Tape reconnecting";
    return "Tape idle";
  }, [connectionStatus]);

  const tone =
    connectionStatus === "connected"
      ? "text-emerald-300"
      : connectionStatus === "connecting" || connectionStatus === "error"
        ? "text-amber-300"
        : "text-zinc-500";

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-app-subtle bg-app-ticker-band px-2 py-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-zinc-500",
      )}
      aria-label="Market discovery status"
    >
      <span className="inline-flex items-center gap-1.5">
        <Database className="h-3 w-3 text-zinc-600" aria-hidden />
        <span className="font-mono tabular-nums text-zinc-300">{totalMarkets}</span>
        <span className="normal-case tracking-normal text-zinc-600">loaded</span>
      </span>

      <span className="hidden h-3 w-px bg-white/[0.08] sm:block" aria-hidden />

      <span className="inline-flex items-center gap-1.5">
        <Zap className="h-3 w-3 text-cyan-500/80" aria-hidden />
        <span className="font-mono tabular-nums text-zinc-400">{liveCount}</span>
        <span className="normal-case tracking-normal text-zinc-600">live now</span>
      </span>

      <span className="hidden h-3 w-px bg-white/[0.08] md:block" aria-hidden />

      <span className={cn("inline-flex items-center gap-1.5", tone)}>
        <Activity className="h-3 w-3" aria-hidden />
        <span className="normal-case tracking-normal">{feedLabel}</span>
      </span>

      <span className="ml-auto inline-flex items-center gap-1.5 normal-case tracking-normal">
        <span className="text-zinc-600">HTTP</span>
        <span
          className={cn(
            "font-mono text-[10px] tabular-nums text-zinc-400",
            isFetching && "text-cyan-300",
          )}
        >
          {updatedLabel ? `Δ ${updatedLabel}` : "—"}
        </span>
      </span>
    </div>
  );
}
