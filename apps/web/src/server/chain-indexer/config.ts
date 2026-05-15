import "server-only";

import { getBscTestnetRpcUrl, getFactoryAddressRaw } from "@/lib/chain-public-env";
import { defineChain } from "viem";

function envBool(name: string, fallback: boolean): boolean {
  const v = process.env[name];
  if (v === undefined || v === "") return fallback;
  return v === "1" || v.toLowerCase() === "true" || v.toLowerCase() === "yes";
}

function envNum(name: string, fallback: number): number {
  const v = process.env[name];
  if (!v) return fallback;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
}

function envBigInt(name: string, fallback: bigint): bigint {
  const v = process.env[name];
  if (!v) return fallback;
  try {
    return BigInt(v.trim());
  } catch {
    return fallback;
  }
}

export type ChainIndexerConfig = {
  enabled: boolean;
  rpcUrl: string;
  chainId: number;
  contractAddresses: `0x${string}`[];
  confirmations: number;
  maxBlocksPerRun: number;
  canonicalRetention: number;
  bootstrapBelowTip: bigint;
};

export function getChainIndexerConfig(): ChainIndexerConfig | null {
  if (!envBool("CHAIN_INDEXER_ENABLED", false)) return null;

  const rpcUrl = process.env.CHAIN_INDEXER_RPC_URL?.trim() || getBscTestnetRpcUrl();
  if (!rpcUrl) return null;

  const rawAddr =
    process.env.CHAIN_INDEXER_CONTRACT_ADDRESSES?.trim() || getFactoryAddressRaw();
  if (!rawAddr) return null;

  const contractAddresses = rawAddr
    .split(",")
    .map((a) => a.trim().toLowerCase())
    .filter(Boolean)
    .map((a) => (a.startsWith("0x") ? a : (`0x${a}` as `0x${string}`))) as `0x${string}`[];

  if (contractAddresses.length === 0) return null;

  return {
    enabled: true,
    rpcUrl,
    chainId: envNum("CHAIN_INDEXER_CHAIN_ID", 97),
    contractAddresses,
    confirmations: envNum("CHAIN_INDEXER_CONFIRMATIONS", 12),
    maxBlocksPerRun: envNum("CHAIN_INDEXER_MAX_BLOCKS_PER_RUN", 500),
    canonicalRetention: envNum("CHAIN_INDEXER_CANONICAL_RETENTION", 4096),
    bootstrapBelowTip: envBigInt("CHAIN_INDEXER_BOOTSTRAP_BELOW_TIP", 10_000n),
  };
}

export function indexerChain(config: ChainIndexerConfig) {
  return defineChain({
    id: config.chainId,
    name: `chain-indexer-${config.chainId}`,
    nativeCurrency: { name: "native", symbol: "NATIVE", decimals: 18 },
    rpcUrls: { default: { http: [config.rpcUrl] } },
  });
}
