"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { UserRejectedRequestError } from "viem";
import { useAccount, useChainId } from "wagmi";
import {
  invalidateMarketsFeed,
  invalidateMarketLive,
} from "@/shared/api/invalidate";
import { queryKeys } from "@/shared/api/query-keys";
import { testBnbChain } from "@/providers/web3/chains";
import { isChainEnvConfigured, chainEnvConfigErrorMessage } from "../lib/chain-contract-env";
import { formatChainTradeError } from "../lib/format-trade-error";
import {
  marketRecordToDeployInput,
  type DeployableMarketRecord,
} from "../lib/market-to-deploy-input";
import { useDeployOnChainMarket } from "./use-deploy-on-chain-market";

export type DeployAdminMarketInput = DeployableMarketRecord & {
  id: string;
  slug?: string;
};

function formatDeployError(error: unknown): string {
  if (error instanceof UserRejectedRequestError) {
    return "Transaction cancelled";
  }
  return formatChainTradeError(error);
}

/**
 * Step 2: deploy Market.sol on BSC testnet, then persist address via POST /deploy.
 */
export function useDeployAdminMarket() {
  const { address } = useAccount();
  const chainId = useChainId();
  const deploy = useDeployOnChainMarket();
  const qc = useQueryClient();

  return useMutation({
    mutationKey: ["chain", "deploy-admin-market"],
    mutationFn: async (market: DeployAdminMarketInput) => {
      if (!address) {
        throw new Error("Connect admin wallet first");
      }
      if (chainId !== testBnbChain.id) {
        throw new Error("Switch to BNB Testnet (Chain ID 97)");
      }
      if (!isChainEnvConfigured()) {
        throw new Error(chainEnvConfigErrorMessage() || "On-chain env missing.");
      }

      const deployed = await deploy.mutateAsync(marketRecordToDeployInput(market));

      const res = await fetch(`/api/v1/admin/markets/${market.id}/deploy`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onChainAddress: deployed.marketAddress }),
      });

      const payload = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(payload.error ?? "Failed to save on-chain address");
      }

      return deployed;
    },
    onSuccess: (res, market) => {
      const short = `${res.marketAddress.slice(0, 6)}…${res.marketAddress.slice(-4)}`;
      toast.success(`Market deployed at ${short}. Users can now trade.`);
      void qc.invalidateQueries({ queryKey: ["admin", "markets"] });
      invalidateMarketsFeed(qc);
      invalidateMarketLive(qc, market.id, { includeFeed: true });
      if (market.slug) {
        void qc.invalidateQueries({
          queryKey: queryKeys.markets.bySlug(market.slug),
        });
      }
    },
    onError: (e) => {
      if (e instanceof UserRejectedRequestError) {
        toast.error("Transaction cancelled");
        return;
      }
      toast.error(formatDeployError(e));
    },
  });
}
