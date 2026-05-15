import {
  buildCategorizedCryptoFeed,
  type CryptoIntegrationsConfig,
  type CategorizedCryptoFeed,
} from "@orakly/crypto-integrations";

export function getCryptoIntegrationsConfig(): CryptoIntegrationsConfig {
  return {
    secrets: {
      coinmarketcapApiKey: process.env.COINMARKETCAP_API_KEY,
      dextoolsApiKey: process.env.DEXTOOLS_API_KEY,
    },
    logger: {
      warn(message, meta) {
        if (process.env.NODE_ENV === "development") {
          console.warn(`[crypto-data] ${message}`, meta);
        }
      },
    },
  };
}

/** Fresh aggregation — cron / BullMQ worker / manual runs (no Next.js cache). */
export async function buildFreshCryptoFeed(): Promise<CategorizedCryptoFeed> {
  return buildCategorizedCryptoFeed(getCryptoIntegrationsConfig());
}
