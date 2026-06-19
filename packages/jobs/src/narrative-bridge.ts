import type { CryptoMarketCategory } from "@orakly/crypto-integrations";

/** Map ingest bucket + copy → narrative engine key for hub chips / filters. */
export function inferNarrativeFromAutoMarket(input: {
  primaryBucket: CryptoMarketCategory;
  title: string;
  symbol?: string | null;
}): string | null {
  const title = input.title.toLowerCase();
  const sym = (input.symbol ?? "").toLowerCase();

  if (input.primaryBucket === "memecoin_pump") return "Memes";
  if (/\bsolana\b|\bsol\b/.test(title) || sym === "sol") return "Solana";
  if (/\bbase\b|coinbase/.test(title)) return "Base";
  if (/\betf\b/.test(title)) return "ETF";
  if (/\bai\b|artificial intelligence|nvidia|agentic/.test(title)) return "AI";
  if (/\bgaming\b|gamefi/.test(title)) return "Gaming";
  if (/\brwa\b|real.?world/.test(title)) return "RWA";
  if (/\bdefi\b|dex\b|lending/.test(title)) return "DeFi";
  if (/\bmeme\b|doge|pepe|shib/.test(title)) return "Memes";

  switch (input.primaryBucket) {
    case "top_gainers":
    case "trending_all":
      return "DeFi";
    case "top_volume":
      return "DeFi";
    case "new_listings":
      return "Memes";
    default:
      return null;
  }
}

/** Hub-visible category slug (seed taxonomy) when narrative is known. */
export function hubCategorySlugForNarrative(narrative: string): string {
  const map: Record<string, string> = {
    Memes: "meme-coins",
    AI: "crypto-narratives",
    DeFi: "crypto-narratives",
    ETF: "industry-events",
    Solana: "ecosystems",
    Base: "ecosystems",
    RWA: "industry-events",
    Gaming: "market-sentiment",
  };
  return map[narrative] ?? "crypto-narratives";
}
