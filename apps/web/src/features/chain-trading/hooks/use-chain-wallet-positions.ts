"use client";

import { useQuery } from "@tanstack/react-query";
import { formatUnits, type Address } from "viem";
import { erc20Abi } from "../abis/erc20";
import { marketAbi } from "../abis/market";
import { createChainTradingPublicClient } from "../lib/viem-read-client";
import { outcomeShareDecimals } from "../lib/chain-contract-env";

export type ChainMarketPosition = {
  marketId: string;
  slug: string;
  title: string;
  marketAddress: Address;
  yesShares: number;
  noShares: number;
  /** Approximate mark-to-market using mid YES probability. */
  valueUsd: number;
};

type DeployedMarketRef = {
  id: string;
  slug: string;
  title: string;
  onChainAddress: string;
  midYes: number;
};

/**
 * Reads YES/NO outcome token balances for every on-chain market in the feed.
 */
export function useChainWalletPositions(
  address: Address | undefined,
  markets: DeployedMarketRef[] | undefined,
) {
  const deployed = (markets ?? []).filter((m) => m.onChainAddress);

  return useQuery({
    queryKey: [
      "chain",
      "wallet-positions",
      address ?? "none",
      deployed.map((m) => `${m.id}:${m.onChainAddress}`).join("|"),
    ],
    enabled: Boolean(address) && deployed.length > 0,
    staleTime: 12_000,
    refetchInterval: 30_000,
    retry: 1,
    queryFn: async (): Promise<ChainMarketPosition[]> => {
      const client = createChainTradingPublicClient();
      const user = address!;

      const rows: ChainMarketPosition[] = [];

      for (const m of deployed) {
        const marketAddress = m.onChainAddress as Address;
        try {
          const [yesToken, noToken] = await Promise.all([
            client.readContract({
              address: marketAddress,
              abi: marketAbi,
              functionName: "yesToken",
            }),
            client.readContract({
              address: marketAddress,
              abi: marketAbi,
              functionName: "noToken",
            }),
          ]);

          const [yesBal, noBal] = await Promise.all([
            client.readContract({
              address: yesToken as Address,
              abi: erc20Abi,
              functionName: "balanceOf",
              args: [user],
            }),
            client.readContract({
              address: noToken as Address,
              abi: erc20Abi,
              functionName: "balanceOf",
              args: [user],
            }),
          ]);

          const shareDecimals = outcomeShareDecimals();
          const yesShares = Number.parseFloat(
            formatUnits(yesBal as bigint, shareDecimals),
          );
          const noShares = Number.parseFloat(
            formatUnits(noBal as bigint, shareDecimals),
          );
          if (yesShares <= 0 && noShares <= 0) continue;

          const midYes = m.midYes;
          const valueUsd = yesShares * midYes + noShares * (1 - midYes);

          rows.push({
            marketId: m.id,
            slug: m.slug,
            title: m.title,
            marketAddress,
            yesShares,
            noShares,
            valueUsd,
          });
        } catch {
          /* skip markets that fail RPC reads */
        }
      }

      return rows.sort((a, b) => b.valueUsd - a.valueUsd);
    },
  });
}
