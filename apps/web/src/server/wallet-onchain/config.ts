import "server-only";

import { getBscTestnetRpcUrl } from "@/lib/chain-public-env";
import { testBnbChain } from "@/providers/web3/chains";

function envNum(name: string, fallback: number): number {
  const v = process.env[name];
  if (!v) return fallback;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
}

export type WalletOnChainToken = {
  address: `0x${string}`;
  symbol: string;
  decimals: number;
};

/** Canonical Multicall3 deployment used when chain config omits it. */
export const MULTICALL3_ADDRESS =
  "0xca11bde05977b3631167028862be2a173976ca11" as const;

/**
 * CSV tokens: `0xabc...:SYMBOL:decimals` repeated, comma-separated.
 * Native balance is always synced separately (not listed here).
 */
export function parseWalletTokenList(raw: string | undefined): WalletOnChainToken[] {
  if (!raw?.trim()) return [];
  const out: WalletOnChainToken[] = [];
  for (const part of raw.split(",")) {
    const seg = part.trim();
    if (!seg) continue;
    const bits = seg.split(":");
    if (bits.length !== 3) continue;
    const [addr, symbol, decStr] = bits;
    if (!addr?.startsWith("0x") || !symbol) continue;
    const decimals = Number.parseInt(decStr ?? "", 10);
    if (!Number.isFinite(decimals) || decimals < 0 || decimals > 77) continue;
    out.push({
      address: addr.trim().toLowerCase() as `0x${string}`,
      symbol: symbol.trim(),
      decimals,
    });
  }
  return out;
}

export type WalletOnChainRuntimeConfig = {
  rpcUrl: string;
  chainId: number;
  nativeSymbol: string;
  nativeDecimals: number;
  tokens: WalletOnChainToken[];
  minSyncIntervalMs: number;
};

function defaultCollateralTokenFromEnv(): WalletOnChainToken[] {
  const addr = process.env.NEXT_PUBLIC_COLLATERAL_ADDRESS?.trim();
  if (!addr?.startsWith("0x")) return [];
  const decimals = envNum("NEXT_PUBLIC_COLLATERAL_DECIMALS", 6);
  return [
    {
      address: addr.toLowerCase() as `0x${string}`,
      symbol: "USDC",
      decimals,
    },
  ];
}

export function getWalletOnChainConfig(): WalletOnChainRuntimeConfig | null {
  const rpcUrl =
    process.env.WALLET_ONCHAIN_RPC_URL?.trim() || getBscTestnetRpcUrl();
  if (!rpcUrl) return null;

  const chainId = envNum("WALLET_ONCHAIN_CHAIN_ID", testBnbChain.id);
  const parsed = parseWalletTokenList(process.env.WALLET_ONCHAIN_TOKENS);
  const tokens = parsed.length > 0 ? parsed : defaultCollateralTokenFromEnv();

  const nativeSymbol =
    process.env.WALLET_ONCHAIN_NATIVE_SYMBOL?.trim() ||
    (chainId === testBnbChain.id ? testBnbChain.nativeCurrency.symbol : "NATIVE");

  const nativeDecimals =
    chainId === testBnbChain.id ?
      testBnbChain.nativeCurrency.decimals
    : envNum("WALLET_ONCHAIN_NATIVE_DECIMALS", 18);

  return {
    rpcUrl,
    chainId,
    nativeSymbol,
    nativeDecimals,
    tokens,
    minSyncIntervalMs: envNum("WALLET_ONCHAIN_MIN_SYNC_INTERVAL_MS", 25_000),
  };
}
