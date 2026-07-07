export const NARRATIVE_KEYS = [
  "AI",
  "Memes",
  "Solana",
  "Base",
  "RWA",
  "Gaming",
  "DeFi",
  "ETF",
] as const;

export type NarrativeKey = (typeof NARRATIVE_KEYS)[number];

export const NEWS_KEYWORD_MAP: ReadonlyArray<{
  pattern: RegExp;
  narrative: NarrativeKey;
}> = [
  { pattern: /\bai\b|artificial intelligence|agentic/i, narrative: "AI" },
  { pattern: /\bsolana\b|\bsol\b/i, narrative: "Solana" },
  { pattern: /\bbase\b|coinbase l2/i, narrative: "Base" },
  { pattern: /\betf\b|spot etf/i, narrative: "ETF" },
  { pattern: /\bmeme\b|memecoin|doge|pepe|shib/i, narrative: "Memes" },
  { pattern: /\bgaming\b|gamefi|play.?to.?earn/i, narrative: "Gaming" },
  { pattern: /\brwa\b|real.?world asset/i, narrative: "RWA" },
  { pattern: /\bdefi\b|decentralized finance|dex\b|lending protocol/i, narrative: "DeFi" },
];

export const COINGECKO_CATEGORY_MAP: Record<string, NarrativeKey> = {
  "artificial-intelligence": "AI",
  "ai-big-data": "AI",
  "meme-token": "Memes",
  "solana-ecosystem": "Solana",
  "base-ecosystem": "Base",
  "real-world-assets-rwa": "RWA",
  gaming: "Gaming",
  "gaming-blockchain": "Gaming",
  "decentralized-finance-defi": "DeFi",
  defi: "DeFi",
};

export const DEFILLAMA_CHAIN_MAP: Record<string, NarrativeKey> = {
  Base: "Base",
  Solana: "Solana",
  Ethereum: "DeFi",
};

export const REDDIT_SUBREDDITS = [
  "CryptoCurrency",
  "solana",
  "ethereum",
  "defi",
  "base",
] as const;

export const CACHE_TTL_MS = 10 * 60 * 1000;
export const HTTP_TIMEOUT_MS = 10_000;
export const HTTP_MAX_RETRIES = 3;
