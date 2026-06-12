export type NarrativeWarPairDef = {
  id: string;
  narrativeA: string;
  narrativeB: string;
  label: string;
};

export const NARRATIVE_WAR_PAIRS: readonly NarrativeWarPairDef[] = [
  { id: "ai-memes", narrativeA: "AI", narrativeB: "Memes", label: "AI vs Memes" },
  { id: "base-solana", narrativeA: "Base", narrativeB: "Solana", label: "Base vs Solana" },
  { id: "rwa-gaming", narrativeA: "RWA", narrativeB: "Gaming", label: "RWA vs Gaming" },
] as const;
