import type { Market } from "@orakly/types";

/**
 * Ranks markets by how many hub feed lanes list them (list trending + volume +
 * activity + hot + new), then by volume. Uses only the five scoped hub API
 * responses — no static or random picks.
 */
export function pickCrossLaneHotMarkets(
  lanes: readonly (readonly Market[])[],
  limit: number,
): Market[] {
  if (limit <= 0) return [];
  const byId = new Map<string, { market: Market; hits: number }>();

  for (const lane of lanes) {
    const seenInLane = new Set<string>();
    for (const m of lane) {
      if (seenInLane.has(m.id)) continue;
      seenInLane.add(m.id);
      const cur = byId.get(m.id);
      const pick =
        !cur
          ? m
          : m.volumeUsd > cur.market.volumeUsd
            ? m
            : m.volumeUsd === cur.market.volumeUsd && m.liquidityUsd > cur.market.liquidityUsd
              ? m
              : cur.market;
      byId.set(m.id, {
        market: pick,
        hits: (cur?.hits ?? 0) + 1,
      });
    }
  }

  const ranked = Array.from(byId.values()).sort((a, b) => {
    if (b.hits !== a.hits) return b.hits - a.hits;
    return b.market.volumeUsd - a.market.volumeUsd;
  });

  return ranked.slice(0, limit).map((x) => x.market);
}
