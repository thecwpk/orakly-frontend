"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  invalidateMarketsFeed,
  invalidateMarketLive,
} from "@/shared/api/invalidate";
import { queryKeys } from "@/shared/api/query-keys";
import { adminApi } from "@/widgets/admin-dashboard/lib/admin-api";
import {
  marketRecordToDeployInput,
  type DeployableMarketRecord,
} from "../lib/market-to-deploy-input";
import { formatChainTradeError } from "../lib/format-trade-error";
import { useDeployOnChainMarket } from "./use-deploy-on-chain-market";

export type LinkMarketOnChainInput = DeployableMarketRecord & {
  id: string;
  slug?: string;
  status?: string;
};

/**
 * Deploy Market.sol for an existing DB row, then PATCH `onChainAddress` + `chainId`.
 */
export function useLinkMarketOnChain() {
  const deploy = useDeployOnChainMarket();
  const qc = useQueryClient();

  return useMutation({
    mutationKey: ["chain", "link-market"],
    mutationFn: async (market: LinkMarketOnChainInput) => {
      const deployed = await deploy.mutateAsync(marketRecordToDeployInput(market));
      await adminApi(`/markets/${market.id}`, {
        method: "PATCH",
        json: {
          onChainAddress: deployed.marketAddress,
          chainId: deployed.chainId,
          ...(market.status !== "OPEN" ? { status: "OPEN" } : {}),
        },
      });
      return deployed;
    },
    onSuccess: (_res, market) => {
      toast.success(`On-chain market linked`, {
        description: market.title.slice(0, 64),
      });
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
      if (e instanceof Error) toast.error(formatChainTradeError(e));
    },
  });
}
