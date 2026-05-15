import type { Prisma } from "@prisma/client";
import type { CryptoMarketCategory } from "@orakly/crypto-integrations";

/** Child slugs under root `crypto` — mirrors ingestion buckets. */
export const CRYPTO_CATEGORY_TREE = {
  root: { slug: "crypto", name: "Crypto" },
  children: [
    { slug: "crypto-meme", name: "Meme coins" },
    { slug: "crypto-momentum", name: "Momentum" },
    { slug: "crypto-volume", name: "Volume" },
    { slug: "crypto-new", name: "New listings" },
  ],
} as const;

export function resolveAutoCategorySlug(
  bucket: CryptoMarketCategory,
): string {
  switch (bucket) {
    case "memecoin_pump":
      return "crypto-meme";
    case "top_gainers":
    case "trending_all":
      return "crypto-momentum";
    case "top_volume":
      return "crypto-volume";
    case "new_listings":
      return "crypto-new";
    default:
      return CRYPTO_CATEGORY_TREE.root.slug;
  }
}

/** Ensures Crypto → thematic children exist (Postgres-friendly hierarchy). */
export async function ensureCryptoCategoryTree(
  tx: Prisma.TransactionClient,
): Promise<{ rootId: string; slugToId: Map<string, string> }> {
  const root = await tx.category.upsert({
    where: { slug: CRYPTO_CATEGORY_TREE.root.slug },
    create: {
      slug: CRYPTO_CATEGORY_TREE.root.slug,
      name: CRYPTO_CATEGORY_TREE.root.name,
    },
    update: { name: CRYPTO_CATEGORY_TREE.root.name },
  });

  const slugToId = new Map<string, string>();
  slugToId.set(root.slug, root.id);

  for (const child of CRYPTO_CATEGORY_TREE.children) {
    const row = await tx.category.upsert({
      where: { slug: child.slug },
      create: {
        slug: child.slug,
        name: child.name,
        parentId: root.id,
      },
      update: {
        name: child.name,
        parentId: root.id,
      },
    });
    slugToId.set(row.slug, row.id);
  }

  return { rootId: root.id, slugToId };
}

export function pickCategoryId(
  slugToId: Map<string, string>,
  bucket: CryptoMarketCategory,
): string {
  const slug = resolveAutoCategorySlug(bucket);
  const id =
    slugToId.get(slug) ?? slugToId.get(CRYPTO_CATEGORY_TREE.root.slug);
  if (!id) {
    throw new Error("crypto_category_tree_missing_root");
  }
  return id;
}
