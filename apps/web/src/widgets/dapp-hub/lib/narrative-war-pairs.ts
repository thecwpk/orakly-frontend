export type NarrativeWarPairDef = {
  id: string;
  leftSlug: string;
  rightSlug: string;
  leftName: string;
  rightName: string;
  label: string;
};

/** Suggested head-to-head battles for empty state. */
export const SUGGESTED_BATTLES: readonly NarrativeWarPairDef[] = [
  {
    id: "ai-memes",
    leftSlug: "ai",
    rightSlug: "memes",
    leftName: "AI",
    rightName: "Memes",
    label: "AI vs Memes",
  },
  {
    id: "defi-rwa",
    leftSlug: "defi",
    rightSlug: "rwa",
    leftName: "DeFi",
    rightName: "RWA",
    label: "DeFi vs RWA",
  },
  {
    id: "ethereum-bnb",
    leftSlug: "ethereum",
    rightSlug: "bnb",
    leftName: "Ethereum",
    rightName: "BNB",
    label: "Ethereum vs BNB",
  },
  {
    id: "layer1-layer2",
    leftSlug: "layer1",
    rightSlug: "layer2",
    leftName: "Layer1",
    rightName: "Layer2",
    label: "Layer1 vs Layer2",
  },
] as const;

/** @deprecated Prefer SUGGESTED_BATTLES — kept for hub cards. */
export const NARRATIVE_WAR_PAIRS = [
  { id: "ai-memes", narrativeA: "AI", narrativeB: "Memes", label: "AI vs Memes" },
  { id: "base-solana", narrativeA: "Base", narrativeB: "Solana", label: "Base vs Solana" },
  { id: "rwa-gaming", narrativeA: "RWA", narrativeB: "Gaming", label: "RWA vs Gaming" },
] as const;
