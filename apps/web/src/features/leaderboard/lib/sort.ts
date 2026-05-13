import type { LeaderboardSortKey, RankedTrader, Trader } from "./types";

/** Apply the active sort key, then assign 1-indexed ranks + rank deltas. */
export function rankTraders(input: {
  traders: ReadonlyArray<Trader>;
  sort: LeaderboardSortKey;
  /** Previous rank by address — used to compute rank delta arrows. */
  previousRanks: ReadonlyMap<string, number>;
}): RankedTrader[] {
  const sorted = [...input.traders].sort((a, b) => sortValue(b, input.sort) - sortValue(a, input.sort));
  return sorted.map((t, i) => {
    const rank = i + 1;
    const previous = input.previousRanks.get(t.address);
    const rankDelta = previous != null ? previous - rank : 0;
    return { ...t, rank, rankDelta };
  });
}

function sortValue(t: Trader, key: LeaderboardSortKey): number {
  switch (key) {
    case "pnl":
      return t.pnlUsd;
    case "roi":
      return t.roiPct;
    case "volume":
      return t.volumeUsd;
    case "winRate":
      return t.winRatePct;
  }
}

/** Build a `Map<address, rank>` snapshot from a ranked list. */
export function snapshotRanks(rows: ReadonlyArray<RankedTrader>): Map<string, number> {
  const out = new Map<string, number>();
  for (const r of rows) out.set(r.address, r.rank);
  return out;
}
