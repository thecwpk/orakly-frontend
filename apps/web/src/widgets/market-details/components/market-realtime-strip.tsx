"use client";

import type { MarketOddsDto } from "@/shared/api/fetchers/markets-live";
import type { MarketRealtimeSnapshot } from "@/websocket/store/market-realtime-store";
import { cn } from "@/lib/utils";
import { memo, useEffect, useMemo, useRef, useState } from "react";

function MarketRealtimeStripInner({
  yesLabel,
  noLabel,
  midYes,
  seq,
  odds,
  rt,
}: {
  yesLabel: string;
  noLabel: string;
  midYes: number;
  seq: number;
  odds: MarketOddsDto | undefined;
  rt: MarketRealtimeSnapshot;
}) {
  const prevMidRef = useRef(midYes);
  const [flash, setFlash] = useState<"up" | "down" | null>(null);

  useEffect(() => {
    const prev = prevMidRef.current;
    prevMidRef.current = midYes;
    const d = midYes - prev;
    if (!Number.isFinite(d) || Math.abs(d) < 1e-7) return;
    setFlash(d > 0 ? "up" : "down");
    const t = window.setTimeout(() => setFlash(null), 480);
    return () => window.clearTimeout(t);
  }, [midYes]);

  const spreadBps = useMemo(() => {
    const ask = Number.parseFloat(rt.odds?.yesPrice ?? odds?.yesPrice ?? "");
    if (!Number.isFinite(ask)) return 50;
    const synth = Math.round(Math.abs(0.5 - midYes) * 200 + 25);
    return Math.max(15, Math.min(120, synth));
  }, [rt.odds?.yesPrice, odds?.yesPrice, midYes]);

  return (
    <div className="surface-terminal flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-lg border border-white/[0.06] px-2.5 py-1.5 ring-1 ring-white/[0.04]">
      <div className="flex items-center gap-2">
        <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-zinc-600">
          Mid
        </span>
        <span
          className={cn(
            "font-mono text-[13px] font-semibold tabular-nums transition-colors duration-300",
            flash === "up" && "text-emerald-300",
            flash === "down" && "text-rose-300",
            !flash && "text-zinc-100",
          )}
        >
          {(midYes * 100).toFixed(1)}¢
        </span>
      </div>

      <span className="hidden h-4 w-px bg-white/[0.08] sm:block" aria-hidden />

      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 font-mono text-[10px] tabular-nums">
        <span className="text-cyan-300/90">YES {yesLabel}</span>
        <span className="text-zinc-600">·</span>
        <span className="text-violet-300/90">NO {noLabel}</span>
      </div>

      <span className="hidden h-4 w-px bg-white/[0.08] md:block" aria-hidden />

      <span className="font-mono text-[10px] tabular-nums text-zinc-500">
        spr {spreadBps} bps
      </span>

      <span className="ml-auto flex items-center gap-1.5">
        {seq > 0 ? (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/12 px-1.5 py-0.5 font-mono text-[9.5px] text-emerald-300 ring-1 ring-emerald-500/22">
            <span className="relative flex h-1 w-1">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/65" />
              <span className="relative inline-flex h-1 w-1 rounded-full bg-emerald-400" />
            </span>
            seq {seq}
          </span>
        ) : (
          <span className="rounded-md bg-white/[0.04] px-1.5 py-0.5 font-mono text-[9.5px] text-zinc-500 ring-1 ring-white/[0.06]">
            Polling
          </span>
        )}
      </span>
    </div>
  );
}

export const MarketRealtimeStrip = memo(MarketRealtimeStripInner);
