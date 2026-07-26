"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { type Address, UserRejectedRequestError } from "viem";
import {
  deployContract,
  waitForTransactionReceipt,
} from "wagmi/actions";
import { useAccount, useChainId, useWalletClient } from "wagmi";
import { putAdminConfig } from "@/widgets/admin-dashboard/lib/admin-api";
import { testBnbChain } from "@/providers/web3/chains";
import { wagmiConfig } from "@/providers/web3/wagmi-config";
import { marketAbi } from "../abis/market";
import { marketFactoryAbi } from "../abis/market-factory";
import { marketBytecode } from "../bytecode/market";
import { marketFactoryBytecode } from "../bytecode/market-factory";
import { formatChainTradeError } from "../lib/format-trade-error";
import { setRuntimeFactoryAddress } from "@/lib/chain-public-env";

export type UpgradeFactoryResult = {
  implementation: Address;
  factory: Address;
  deployBlock: string;
  implTxHash: `0x${string}`;
  factoryTxHash: `0x${string}`;
};

/**
 * Redeploy Market implementation + MarketFactory (with createMarkets) via MetaMask.
 * Persists the new factory address for bulk one-confirm deploys.
 */
export function useUpgradeMarketFactory() {
  const { address } = useAccount();
  const chainId = useChainId();
  const { data: walletClient } = useWalletClient();
  const qc = useQueryClient();

  return useMutation({
    mutationKey: ["chain", "upgrade-market-factory"],
    mutationFn: async (): Promise<UpgradeFactoryResult> => {
      if (!address) throw new Error("Connect admin wallet first");
      if (!walletClient) throw new Error("Wallet client unavailable");
      if (chainId !== testBnbChain.id) {
        throw new Error("Switch MetaMask to BNB Smart Chain (chain 97)");
      }

      toast.message("Confirm Market implementation deploy in MetaMask…");
      const implHash = await deployContract(wagmiConfig, {
        abi: marketAbi,
        bytecode: marketBytecode,
        chainId: testBnbChain.id,
        account: address,
      });
      const implReceipt = await waitForTransactionReceipt(wagmiConfig, {
        hash: implHash,
        chainId: testBnbChain.id,
      });
      if (implReceipt.status !== "success" || !implReceipt.contractAddress) {
        throw new Error("Market implementation deploy failed");
      }
      const implementation = implReceipt.contractAddress;

      toast.message("Confirm MarketFactory deploy in MetaMask…");
      const factoryHash = await deployContract(wagmiConfig, {
        abi: marketFactoryAbi,
        bytecode: marketFactoryBytecode,
        args: [implementation, address],
        chainId: testBnbChain.id,
        account: address,
      });
      const factoryReceipt = await waitForTransactionReceipt(wagmiConfig, {
        hash: factoryHash,
        chainId: testBnbChain.id,
      });
      if (factoryReceipt.status !== "success" || !factoryReceipt.contractAddress) {
        throw new Error("MarketFactory deploy failed");
      }

      const factory = factoryReceipt.contractAddress;
      const deployBlock = factoryReceipt.blockNumber.toString();

      setRuntimeFactoryAddress(factory, deployBlock);

      await putAdminConfig([
        { key: "chain_factory_address", value: factory },
        { key: "chain_factory_deploy_block", value: deployBlock },
        { key: "chain_market_implementation", value: implementation },
      ]);

      // Keep local env in sync for next restarts (best-effort; ignored on Vercel).
      try {
        await fetch("/api/v1/admin/chain/factory-env", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            factoryAddress: factory,
            factoryDeployBlock: deployBlock,
          }),
        });
      } catch {
        /* optional */
      }

      return {
        implementation,
        factory,
        deployBlock,
        implTxHash: implHash,
        factoryTxHash: factoryHash,
      };
    },
    onSuccess: (res) => {
      toast.success(
        `Factory upgraded at ${res.factory.slice(0, 8)}… — bulk deploy now uses one confirmation.`,
      );
      void qc.invalidateQueries({ queryKey: ["admin"] });
      void qc.invalidateQueries({ queryKey: ["chain-config"] });
    },
    onError: (e) => {
      if (e instanceof UserRejectedRequestError) {
        toast.error("Transaction cancelled");
        return;
      }
      toast.error(formatChainTradeError(e));
    },
  });
}
