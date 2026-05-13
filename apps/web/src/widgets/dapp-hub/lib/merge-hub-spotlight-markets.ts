import type { Market } from "@orakly/types";

/** Round-robin pick across buckets; skips duplicates by market id. */
export function mergeRoundRobinUniqueBuckets(
  buckets: readonly (readonly Market[])[],
  limit: number,
): Market[] {
  const seen = new Set<string>();
  const out: Market[] = [];

  for (let round = 0; round < 64 && out.length < limit; round++) {
    for (const bucket of buckets) {
      const m = bucket[round];
      if (!m || seen.has(m.id)) continue;
      seen.add(m.id);
      out.push(m);
      if (out.length >= limit) return out;
    }
  }

  return out;
}

/**
 * Blend five hub feed lanes (list trending + volume/activity/hot/new trending)
 * into up to five unique markets — carousel spotlight slots.
 */
export function mergeHubSpotlightMarkets(
  listTrending: readonly Market[],
  volumeTrending: readonly Market[],
  activityTrending: readonly Market[],
  hotTrending: readonly Market[],
  newTrending: readonly Market[],
): Market[] {
  return mergeRoundRobinUniqueBuckets(
    [
      listTrending,
      volumeTrending,
      activityTrending,
      hotTrending,
      newTrending,
    ],
    5,
  );
}

/** “All” hub pill — round-robin across the same five hub API lanes only (no directory / no static). */
export function mergeHubBrowsePreview(
  listTrending: readonly Market[],
  volumeTrending: readonly Market[],
  activityTrending: readonly Market[],
  hotTrending: readonly Market[],
  newTrending: readonly Market[],
  limit: number,
): Market[] {
  return mergeRoundRobinUniqueBuckets(
    [
      listTrending,
      volumeTrending,
      activityTrending,
      hotTrending,
      newTrending,
    ],
    limit,
  );
}
