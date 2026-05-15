import type { CryptoMarketCategory } from "./categories";
import type { NormalizedCryptoAsset } from "./normalized";
import type { CryptoDataProviderId } from "./providers";

export type AdapterRunError = {
  provider: CryptoDataProviderId;
  code: string;
  message: string;
  retryable?: boolean;
  status?: number;
};

/** Leaderboards per category — `trending_all` is global merge sorted by strongest signal. */
export type CategorizedCryptoFeed = {
  generatedAt: string;
  byCategory: Record<CryptoMarketCategory, NormalizedCryptoAsset[]>;
  mergedAssets: NormalizedCryptoAsset[];
  errors: AdapterRunError[];
};
