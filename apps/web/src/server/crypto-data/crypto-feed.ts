import "server-only";

import type { CategorizedCryptoFeed } from "@orakly/crypto-integrations";
import { buildFreshCryptoFeed } from "@orakly/jobs";
import { unstable_cache } from "next/cache";
import { cacheTags } from "@/cache/next-tags";

export { getCryptoIntegrationsConfig } from "@orakly/jobs";

/** Fresh aggregation — call from cron / jobs / manual invalidation. */
export async function refreshCryptoFeed(): Promise<CategorizedCryptoFeed> {
  return buildFreshCryptoFeed();
}

/** Shared read path for Server Components / internal Route Handlers (Next.js Data Cache). */
export function getCachedCryptoFeed(): Promise<CategorizedCryptoFeed> {
  return unstable_cache(
    () => refreshCryptoFeed(),
    ["internal-crypto-feed-v2"],
    { revalidate: 120, tags: [cacheTags.cryptoFeed] },
  )();
}
