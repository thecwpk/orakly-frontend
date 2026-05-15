import { fetchCoingeckoNormalized } from "../adapters/coingecko.adapter";
import { fetchCoinmarketcapNormalized } from "../adapters/coinmarketcap.adapter";
import { fetchDexscreenerNormalized } from "../adapters/dexscreener.adapter";
import { fetchDextoolsNormalized } from "../adapters/dextools.adapter";
import { fetchPumpfunNormalized } from "../adapters/pumpfun.adapter";
import {
  createAdapterRuntime,
  toAdapterRunError,
  type CryptoIntegrationsConfig,
} from "../core/adapter-runtime";
import type { CategorizedCryptoFeed } from "../types/feed";
import type { NormalizedCryptoAsset } from "../types/normalized";
import type { CryptoDataProviderId } from "../types/providers";
import {
  buildCategorizedLeaderboards,
  mergeNormalizedAssets,
} from "./aggregator";

type AdapterJob = {
  id: CryptoDataProviderId;
  run: () => Promise<NormalizedCryptoAsset[]>;
};

/**
 * Fetches all configured providers in parallel, merges on `dedupeKey`, then builds
 * per-category leaderboards (strongest signals surface first within each bucket).
 */
export async function buildCategorizedCryptoFeed(
  config: CryptoIntegrationsConfig,
): Promise<CategorizedCryptoFeed> {
  const rt = createAdapterRuntime(config);

  const jobs: AdapterJob[] = [
    { id: "dexscreener", run: () => fetchDexscreenerNormalized(rt, {}) },
    { id: "coingecko", run: () => fetchCoingeckoNormalized(rt) },
    { id: "coinmarketcap", run: () => fetchCoinmarketcapNormalized(rt) },
    { id: "dextools", run: () => fetchDextoolsNormalized(rt) },
    { id: "pumpfun", run: () => fetchPumpfunNormalized(rt) },
  ];

  const settled = await Promise.allSettled(jobs.map((j) => j.run()));
  const errors = settled
    .map((res, i) =>
      res.status === "rejected"
        ? toAdapterRunError(jobs[i]!.id, res.reason)
        : null,
    )
    .filter((x): x is NonNullable<typeof x> => x != null);

  const merged = new Map<string, NormalizedCryptoAsset>();

  for (let i = 0; i < settled.length; i++) {
    const res = settled[i]!;
    if (res.status !== "fulfilled") continue;
    for (const asset of res.value) {
      if (!asset.dedupeKey) continue;
      const prev = merged.get(asset.dedupeKey);
      merged.set(
        asset.dedupeKey,
        prev ? mergeNormalizedAssets(prev, asset) : asset,
      );
    }
  }

  const mergedAssets = [...merged.values()];
  const byCategory = buildCategorizedLeaderboards(mergedAssets);

  return {
    generatedAt: new Date().toISOString(),
    mergedAssets,
    byCategory,
    errors,
  };
}
