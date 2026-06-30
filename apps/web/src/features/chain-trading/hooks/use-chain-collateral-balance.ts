"use client";

import { useQuery } from "@tanstack/react-query";
import { formatUnits, type Address } from "viem";
import { erc20Abi } from "../abis/erc20";
import { getCollateralAddress } from "../lib/chain-contract-env";
import { createChainTradingPublicClient } from "../lib/viem-read-client";

export type ChainCollateralBalance = {
  raw: bigint;
  decimals: number;
  /** Human-readable collateral units (e.g. USDC). */
  formatted: number;
  symbol: string;
};

/**
 * Live ERC-20 collateral balance for the connected wallet (public RPC read).
 */
export function useChainCollateralBalance(address?: Address | null) {
  const collateral = getCollateralAddress();

  return useQuery({
    queryKey: ["chain", "collateral-balance", collateral, address ?? "none"],
    enabled: Boolean(collateral && address),
    staleTime: 8_000,
    refetchInterval: 20_000,
    retry: 1,
    queryFn: async (): Promise<ChainCollateralBalance> => {
      const client = createChainTradingPublicClient();
      const token = collateral!;

      const [decimals, symbol, balance] = await Promise.all([
        client.readContract({
          address: token,
          abi: erc20Abi,
          functionName: "decimals",
        }),
        client.readContract({
          address: token,
          abi: erc20Abi,
          functionName: "symbol",
        }),
        client.readContract({
          address: token,
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [address!],
        }),
      ]);

      const dec = Number(decimals);
      return {
        raw: balance as bigint,
        decimals: dec,
        formatted: Number.parseFloat(formatUnits(balance as bigint, dec)),
        symbol: String(symbol),
      };
    },
  });
}
