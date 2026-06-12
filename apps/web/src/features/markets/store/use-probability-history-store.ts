"use client";

import { useSyncExternalStore } from "react";

const BUFFER_SIZE = 24;

type Bucket = {
  points: number[];
  listeners: Set<() => void>;
  anchor: number;
};

const buckets = new Map<string, Bucket>();
const EMPTY: number[] = [];

function clamp01(x: number): number {
  if (x < 0.02) return 0.02;
  if (x > 0.98) return 0.98;
  return x;
}

function emit(bucket: Bucket) {
  for (const fn of bucket.listeners) fn();
}

function ensureBucket(marketId: string, anchor: number): Bucket {
  let b = buckets.get(marketId);
  if (!b) {
    const v = clamp01(anchor);
    b = {
      points: [v],
      listeners: new Set(),
      anchor: v,
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

export function seedProbabilityHistory(marketId: string, anchor: number) {
  if (!marketId) return;
  const b = ensureBucket(marketId, anchor);
  const v = clamp01(anchor);
  if (b.points.length === 0 || b.points[b.points.length - 1] !== v) {
    b.points = [v];
    b.anchor = v;
    emit(b);
  }
}

export function appendProbabilitySample(
  marketId: string | undefined,
  next: number,
) {
  if (!marketId) return;
  const b = ensureBucket(marketId, next);
  const v = clamp01(next);
  const last = b.points[b.points.length - 1];
  if (last !== undefined && Math.abs(last - v) < 0.0005) return;
  b.points = [...b.points.slice(-(BUFFER_SIZE - 1)), v];
  b.anchor = v;
  emit(b);
}

export function reconcileProbabilityAnchor(
  marketId: string | undefined,
  anchor: number,
) {
  if (!marketId) return;
  appendProbabilitySample(marketId, anchor);
}

export function useProbabilityHistory(
  marketId: string | undefined,
): readonly number[] {
  return useSyncExternalStore(
    (cb) => subscribeProbabilityHistory(marketId, cb),
    () => getProbabilityHistory(marketId),
    () => EMPTY,
  );
}
