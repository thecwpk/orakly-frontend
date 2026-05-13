"use client";

import { useSyncExternalStore } from "react";

/**
 * Per-market probability sparkline buffer.
 *
 * Mirrors the pattern used by `market-realtime-store` — a vanilla store with
 * `useSyncExternalStore`, since this is read by tens of cards at once and we
 * want one notify per update with no React re-render cascade.
 *
 * Seeding strategy:
 *   - First time we see a market id, we seed N synthetic points with a
 *     deterministic walk anchored at the current probability. This means
 *     first paint shows a believable curve without waiting for live trades.
 *   - On each subsequent realtime trade for that market, we append the trade
 *     price (clamped to 0..1) and trim to N points.
 *   - On a fresh feed query that updates the canonical probability, we
 *     append the new probability without re-seeding (so the curve stays
 *     continuous).
 */

const BUFFER_SIZE = 24;

type Bucket = {
  /** Probability points in chronological order (oldest first), in 0..1. */
  points: number[];
  listeners: Set<() => void>;
  /** Last anchor probability we seeded against, for stable equality checks. */
  anchor: number;
};

const buckets = new Map<string, Bucket>();
const EMPTY: number[] = [];

function emit(bucket: Bucket) {
  for (const fn of bucket.listeners) fn();
}

/**
 * Cheap, deterministic 32-bit hash → number in [0, 1). Used to seed the
 * synthetic walk so the same market id produces the same shape across
 * client/server renders.
 */
function hash01(s: string, salt: number): number {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1_000_003) / 1_000_003;
}

function clamp01(x: number): number {
  if (x < 0.02) return 0.02;
  if (x > 0.98) return 0.98;
  return x;
}

function seedSyntheticPoints(marketId: string, anchor: number): number[] {
  const points: number[] = new Array(BUFFER_SIZE);
  let p = clamp01(anchor);
  for (let i = BUFFER_SIZE - 1; i >= 0; i--) {
    points[i] = p;
    const noise = (hash01(marketId, i + 1) - 0.5) * 0.06;
    p = clamp01(p - noise);
  }
  return points;
}

function ensureBucket(marketId: string, anchor: number): Bucket {
  let b = buckets.get(marketId);
  if (!b) {
    b = {
      points: seedSyntheticPoints(marketId, anchor),
      listeners: new Set(),
      anchor,
    };
    buckets.set(marketId, b);
  }
  return b;
}

export function getProbabilityHistory(
  marketId: string | undefined,
): readonly number[] {
  if (!marketId) return EMPTY;
  return buckets.get(marketId)?.points ?? EMPTY;
}

export function subscribeProbabilityHistory(
  marketId: string | undefined,
  cb: () => void,
): () => void {
  if (!marketId) return () => {};
  const b = ensureBucket(marketId, 0.5);
  b.listeners.add(cb);
  return () => {
    b.listeners.delete(cb);
  };
}

/** Lazily seed a bucket without notifying — safe to call from a render path. */
export function seedProbabilityHistory(marketId: string, anchor: number) {
  if (!marketId) return;
  ensureBucket(marketId, clamp01(anchor));
}

/** Append a new probability sample (e.g. on a trade). Notifies listeners. */
export function appendProbabilitySample(
  marketId: string | undefined,
  next: number,
) {
  if (!marketId) return;
  const b = ensureBucket(marketId, next);
  const v = clamp01(next);
  if (b.points.length === 0) {
    b.points = [v];
  } else {
    const last = b.points[b.points.length - 1];
    if (last !== undefined && Math.abs(last - v) < 0.0005) return;
    b.points = [...b.points.slice(-(BUFFER_SIZE - 1)), v];
  }
  b.anchor = v;
  emit(b);
}

/**
 * If the canonical (REST) anchor moved meaningfully but no realtime sample
 * has arrived, push it as a new point. Useful when the React Query cache
 * refreshes via `revalidateTag("markets-feed")`.
 */
export function reconcileProbabilityAnchor(
  marketId: string | undefined,
  anchor: number,
) {
  if (!marketId) return;
  const b = ensureBucket(marketId, anchor);
  const v = clamp01(anchor);
  if (Math.abs(b.anchor - v) < 0.005) return;
  appendProbabilitySample(marketId, v);
}

/** Hook: subscribes to a market's history and returns the latest snapshot. */
export function useProbabilityHistory(
  marketId: string | undefined,
): readonly number[] {
  return useSyncExternalStore(
    (cb) => subscribeProbabilityHistory(marketId, cb),
    () => getProbabilityHistory(marketId),
    () => EMPTY,
  );
}
