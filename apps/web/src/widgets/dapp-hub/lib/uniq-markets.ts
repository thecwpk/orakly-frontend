import type { Market } from "@orakly/types";

/** Dedupe by market id while preserving last-seen order within groups. */
export function uniqMarkets(groups: readonly (readonly Market[])[]): Market[] {
  const map = new Map<string, Market>();
  for (const g of groups) {
    for (const m of g) map.set(m.id, m);
  }
  return [...map.values()];
}
