import type { AdapterRuntime } from "../core/adapter-runtime";
import type { NormalizedCryptoAsset } from "../types/normalized";

const PID = "pumpfun" as const;

/**
 * Pump.fun has no stable public REST contract suitable for server batch jobs.
 * Replace with an approved indexer / mirror when available (Solana programs + HTTP gateway).
 */
export async function fetchPumpfunNormalized(
  rt: AdapterRuntime,
): Promise<NormalizedCryptoAsset[]> {
  rt.logger?.warn("pumpfun.stub_requires_indexer");
  return [];
}
