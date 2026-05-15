/** Consumer-facing buckets — items appear in a category when `categoryScores[cat] > 0`. */
export const CRYPTO_MARKET_CATEGORIES = [
  "trending_all",
  "top_volume",
  "top_gainers",
  "new_listings",
  "memecoin_pump",
] as const;

export type CryptoMarketCategory = (typeof CRYPTO_MARKET_CATEGORIES)[number];

/** Categories backed by explicit adapter signals (excludes merged global board). */
export const CRYPTO_SIGNAL_CATEGORIES = CRYPTO_MARKET_CATEGORIES.filter(
  (c): c is Exclude<CryptoMarketCategory, "trending_all"> =>
    c !== "trending_all",
);
