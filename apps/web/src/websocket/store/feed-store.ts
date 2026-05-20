import type { FeedActivityPayload } from "@orakly/realtime-protocol";

const MAX = 120;

type Row = FeedActivityPayload;

/** Stable empty feed for `useSyncExternalStore` server snapshot — never allocate `[]` per call. */
export const EMPTY_FEED_SNAPSHOT: readonly Row[] = Object.freeze([]);

const rows: Row[] = [];
const listeners = new Set<() => void>();

/** Bump on tape mutation so `useSyncExternalStore` snapshot changes (rows array stays same ref). */
let feedGeneration = 0;

function notify() {
  feedGeneration += 1;
  for (const fn of listeners) fn();
}

export function subscribeFeed(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function getFeedSnapshot(): readonly Row[] {
  return rows;
}

export function getFeedGeneration(): number {
  return feedGeneration;
}

export function applyFeedActivity(payload: FeedActivityPayload) {
  rows.unshift(payload);
  if (rows.length > MAX) rows.length = MAX;
  notify();
}
