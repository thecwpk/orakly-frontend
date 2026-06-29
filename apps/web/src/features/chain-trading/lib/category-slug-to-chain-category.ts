/** Maps DB category slugs to on-chain MarketFactory category enum. */
export function categorySlugToChainCategory(slug: string | null | undefined): 0 | 1 | 2 {
  const s = (slug ?? "").toLowerCase();
  if (s.includes("meme")) return 0;
  if (
    s === "macro" ||
    s === "crypto" ||
    s === "ecosystems" ||
    s === "crypto-narratives" ||
    s === "defi"
  ) {
    return 1;
  }
  return 2;
}
