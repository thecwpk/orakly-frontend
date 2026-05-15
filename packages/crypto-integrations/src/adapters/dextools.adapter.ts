import type { AdapterRuntime } from "../core/adapter-runtime";
import type { NormalizedCryptoAsset } from "../types/normalized";

/**
 * Dextools requires an API key and contract-specific endpoints vary by plan.
 * Implement real HTTP + mapping once credentials and endpoint matrix are finalized.
 */
export async function fetchDextoolsNormalized(
  rt: AdapterRuntime,
): Promise<NormalizedCryptoAsset[]> {
  if (!rt.secrets.dextoolsApiKey) {
    rt.logger?.warn("dextools.skip_missing_api_key");
    return [];
  }
  rt.logger?.warn("dextools.stub_not_implemented");
  return [];
}
