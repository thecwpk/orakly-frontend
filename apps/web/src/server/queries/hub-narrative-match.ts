import type { Prisma } from "@prisma/client";

/** Hub category slugs ↔ narrative engine keys (mirrors categories-overview). */
export const NARRATIVE_CATEGORY_SLUGS: Record<string, readonly string[]> = {
  Memes: ["meme-coins"],
  AI: ["crypto-narratives"],
  DeFi: ["crypto-narratives", "market-sentiment"],
  ETF: ["crypto-narratives", "industry-events", "ecosystems"],
  Solana: ["ecosystems"],
  Base: ["ecosystems"],
  RWA: ["ecosystems", "industry-events"],
  Gaming: ["market-sentiment"],
};

/** Title keywords when markets are not linked via marketSuggestion. */
export const NARRATIVE_TITLE_KEYWORDS: Record<string, readonly string[]> = {
  AI: ["ai", "artificial intelligence", "nvidia", "agentic"],
  Memes: ["meme", "doge", "pepe", "shib"],
  Solana: ["solana", "sol "],
  Base: ["base", "coinbase"],
  RWA: ["rwa", "real-world", "real world"],
  Gaming: ["gaming", "gamefi"],
  DeFi: ["defi", "dex", "lending"],
  ETF: ["etf"],
};

export function buildNarrativeMarketWhere(narrative: string): Prisma.MarketWhereInput {
  const key = narrative.trim();
  const categorySlugs = NARRATIVE_CATEGORY_SLUGS[key] ?? [];
  const keywords = NARRATIVE_TITLE_KEYWORDS[key] ?? [];

  const or: Prisma.MarketWhereInput[] = [
    { marketSuggestion: { narrative: { equals: key, mode: "insensitive" } } },
  ];

  if (categorySlugs.length > 0) {
    or.push({ category: { slug: { in: [...categorySlugs] } } });
  }

  for (const kw of keywords) {
    or.push({ title: { contains: kw, mode: "insensitive" } });
  }

  return { OR: or };
}

export function marketMatchesNarrative(
  market: {
    title: string;
    category?: { slug?: string | null } | null;
    marketSuggestion?: { narrative?: string | null } | null;
  },
  narrative: string,
): boolean {
  const key = narrative.trim();
  const linked = market.marketSuggestion?.narrative;
  if (linked && linked.toLowerCase() === key.toLowerCase()) return true;

  const slug = market.category?.slug;
  if (slug && (NARRATIVE_CATEGORY_SLUGS[key] ?? []).includes(slug)) return true;

  const title = market.title.toLowerCase();
  return (NARRATIVE_TITLE_KEYWORDS[key] ?? []).some((kw) => title.includes(kw.toLowerCase()));
}
