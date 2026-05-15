import type { AdapterRunError } from "../types/feed";
import type { CryptoDataProviderId } from "../types/providers";
import { CryptoIntegrationError } from "./integration-error";
import { createFetchJson } from "./http-client";

export type CryptoIntegrationsSecrets = {
  coinmarketcapApiKey?: string;
  dextoolsApiKey?: string;
};

export type CryptoIntegrationsConfig = {
  secrets?: CryptoIntegrationsSecrets;
  fetchImpl?: typeof fetch;
  logger?: { warn(message: string, meta?: unknown): void };
};

export type AdapterRuntime = {
  fetchJson: ReturnType<typeof createFetchJson>;
  secrets: CryptoIntegrationsSecrets;
  logger?: CryptoIntegrationsConfig["logger"];
};

export function createAdapterRuntime(
  config: CryptoIntegrationsConfig,
): AdapterRuntime {
  const fetchImpl = config.fetchImpl ?? globalThis.fetch.bind(globalThis);
  return {
    fetchJson: createFetchJson(fetchImpl),
    secrets: config.secrets ?? {},
    logger: config.logger,
  };
}

export function toAdapterRunError(
  provider: CryptoDataProviderId,
  err: unknown,
): AdapterRunError {
  if (err instanceof CryptoIntegrationError) {
    return {
      provider,
      code: "UPSTREAM",
      message: err.message,
      retryable: err.retryable,
      status: err.status,
    };
  }
  const message = err instanceof Error ? err.message : String(err);
  return { provider, code: "ADAPTER", message, retryable: false };
}
