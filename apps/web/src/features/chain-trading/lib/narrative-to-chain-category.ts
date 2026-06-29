import type { AdminNarrativeKey } from "@/widgets/admin-dashboard/lib/admin-market-create-presets";

/** Maps hub narrative lanes to on-chain MarketFactory category enum. */
export function narrativeToChainCategory(
  narrative: AdminNarrativeKey | "",
): 0 | 1 | 2 {
  if (narrative === "Memes") return 0;
  if (
    narrative === "macro" ||
    narrative === "market-sentiment" ||
    narrative === "DeFi" ||
    narrative === "ecosystems"
  ) {
    return 1;
  }
  return 2;
}
