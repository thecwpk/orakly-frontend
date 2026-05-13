import type { MarketOddsDto } from "@/shared/api/fetchers/markets-live";
import type { MarketRealtimeSnapshot } from "@/websocket/store/market-realtime-store";

function parsePx(s: string | null | undefined): number | null {
  if (s == null || s === "") return null;
  const n = Number.parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

/** Prefer websocket odds, then REST DTO, then feed probability (0–1). */
export function mergeMidYes(
  feedProbability: number,
  odds: MarketOddsDto | undefined,
  rt: MarketRealtimeSnapshot,
): number {
  const rtY = parsePx(rt.odds?.yesPrice);
  const httpY = parsePx(odds?.yesPrice);
  const base = rtY ?? httpY ?? feedProbability;
  return Math.min(0.99, Math.max(0.01, base));
}

export function mergeYesNoDisplay(
  feedProbability: number,
  odds: MarketOddsDto | undefined,
  rt: MarketRealtimeSnapshot,
): { yes: number; no: number; yesLabel: string; noLabel: string } {
  const yes =
    parsePx(rt.odds?.yesPrice) ??
    parsePx(odds?.yesPrice) ??
    feedProbability;
  const no =
    parsePx(rt.odds?.noPrice) ??
    parsePx(odds?.noPrice) ??
    (1 - feedProbability);
  const y = Math.min(0.99, Math.max(0.01, yes));
  const n = Math.min(0.99, Math.max(0.01, Number.isFinite(no) ? no : 1 - y));
  return {
    yes: y,
    no: n,
    yesLabel: `${Math.round(y * 1000) / 10}%`,
    noLabel: `${Math.round(n * 1000) / 10}%`,
  };
}
