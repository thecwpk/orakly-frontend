export type {
  CryptoIntegrationsConfig,
  CryptoIntegrationsSecrets,
  AdapterRuntime,
} from "./core/adapter-runtime";
export { createAdapterRuntime, toAdapterRunError } from "./core/adapter-runtime";
export { CryptoIntegrationError } from "./core/integration-error";
export { withRetry } from "./core/retry";
export { hitRateGuard } from "./core/rate-guard";
export { createFetchJson } from "./core/http-client";
export { TtlMemoryCache } from "./core/ttl-cache";
export { chunkArray } from "./core/chunk";

export type {
  CryptoMarketCategory,
} from "./types/categories";
export {
  CRYPTO_MARKET_CATEGORIES,
  CRYPTO_SIGNAL_CATEGORIES,
} from "./types/categories";
export type { CryptoDataProviderId } from "./types/providers";
export type { NormalizedCryptoAsset } from "./types/normalized";
export type {
  CategorizedCryptoFeed,
  AdapterRunError,
} from "./types/feed";

export { buildCategorizedCryptoFeed } from "./services/crypto-data.service";
export {
  mergeNormalizedAssets,
  buildCategorizedLeaderboards,
} from "./services/aggregator";
