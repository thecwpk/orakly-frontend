"use client";

import { useEffect, useState } from "react";

/** Returns a counter that increments every `intervalMs` so consumers re-render
 *  to refresh time-ago labels. The actual returned number is unused by callers
 *  — the side effect is the re-render. */
export function useNowTick(intervalMs = 10_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

/** Compact "time ago" label used by activity rows. */
export function timeAgo(atMs: number, nowMs = Date.now()): string {
  const diff = Math.max(0, nowMs - atMs);
  const s = Math.floor(diff / 1000);
  if (s < 5) return "now";
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

export function isoToMs(iso: string | null | undefined): number {
  if (!iso) return 0;
  const ms = new Date(iso).getTime();
  return Number.isFinite(ms) ? ms : 0;
}
