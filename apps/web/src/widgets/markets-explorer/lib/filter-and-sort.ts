import type { Market } from "@orakly/types";
import type { MarketsSort } from "@/features/markets/store/use-markets-filter-store";

export type FilterArgs = {
  searchTerm: string;
  category: string;
  trendingOnly: boolean;
  /** Set of marketIds currently considered "live" (recent activity). */
  liveSet: ReadonlySet<string>;
  /** `0` disables the floor. */
  minLiquidityUsd: number;
  /** `0` disables the floor. */
  minVolumeUsd: number;
};

const TICKER_TOKENS: Record<string, string[]> = {
  crypto: ["btc", "bitcoin", "eth", "ethereum", "sol", "alts"],
  memes: ["pepe", "wif", "doge", "shib", "bonk", "meme"],
  macro: ["fed", "cpi", "rate", "ecb", "gdp", "inflation"],
  politics: ["election", "vote", "policy", "senate", "president"],
  science: ["nasa", "lhc", "starship", "cern", "vaccine"],
  culture: ["nfl", "oscars", "world cup", "cup", "grammy"],
  "ai-tech": ["openai", "gpt", "claude", "llm", "ipo", "ai"],
};

function categoryMatches(m: Market, cat: string): boolean {
  if (cat === "all") return true;
  const c = (m.category || "").toLowerCase();
  if (c === cat.toLowerCase()) return true;
  if (c.includes(cat.toLowerCase())) return true;
  const tokens = TICKER_TOKENS[cat];
  if (!tokens) return false;
  const haystack = `${m.title} ${m.category}`.toLowerCase();
  return tokens.some((t) => haystack.includes(t));
}

export function filterMarkets(
  markets: ReadonlyArray<Market>,
  {
    searchTerm,
    category,
    trendingOnly,
    liveSet,
    minLiquidityUsd,
    minVolumeUsd,
  }: FilterArgs,
): Market[] {
  const q = searchTerm.trim().toLowerCase();
  return markets.filter((m) => {
    if (!categoryMatches(m, category)) return false;
    if (q) {
      const hay = `${m.title} ${m.category}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (trendingOnly && liveSet.size > 0 && !liveSet.has(m.id)) return false;
    if (minLiquidityUsd > 0 && (m.liquidityUsd ?? 0) < minLiquidityUsd) {
      return false;
    }
    if (minVolumeUsd > 0 && (m.volumeUsd ?? 0) < minVolumeUsd) return false;
    return true;
  });
}

export function sortMarkets(
  markets: ReadonlyArray<Market>,
  sort: MarketsSort,
): Market[] {
  const copy = [...markets];
  switch (sort) {
    case "volume24h":
      copy.sort((a, b) => (b.volumeUsd ?? 0) - (a.volumeUsd ?? 0));
      break;
    case "liquidity":
      copy.sort((a, b) => (b.liquidityUsd ?? 0) - (a.liquidityUsd ?? 0));
      break;
    case "tightest":
      copy.sort((a, b) => {
        const ea = Math.abs(0.5 - (a.probability ?? 0.5));
        const eb = Math.abs(0.5 - (b.probability ?? 0.5));
        return ea - eb;
      });
      break;
    case "closingSoon":
      copy.sort(
        (a, b) =>
          new Date(a.closesAt).getTime() - new Date(b.closesAt).getTime(),
      );
      break;
    case "newest":
      // Mock: stable hash by id (newest at top); when a real createdAt exists, swap it.
      copy.reverse();
      break;
    default:
      break;
  }
  return copy;
}
