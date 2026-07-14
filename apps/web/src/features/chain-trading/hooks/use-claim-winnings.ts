"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Address } from "viem";
import { waitForTransactionReceipt } from "wagmi/actions";
import { useAccount, useChainId, useWriteContract } from "wagmi";
import { wagmiConfig } from "@/providers/web3/wagmi-config";
import { testBnbChain } from "@/providers/web3/chains";
import { marketAbi } from "../abis/market";
import { formatChainTradeError } from "../lib/format-trade-error";

/** Calls Market.sol claimWinnings when the market is resolved. */
export function useClaimWinnings() {
  const { address } = useAccount();
  const chainId = useChainId();
  const { writeContractAsync } = useWriteContract();

  return useMutation({
    mutationKey: ["chain", "claim-winnings"],
    mutationFn: async (marketAddress: Address) => {
      if (!address) throw new Error("Connect wallet to claim.");
      if (chainId !== testBnbChain.id) {
        throw new Error("Switch MetaMask to BNB Smart Chain Testnet (chain 97).");
      }

      toast.message("Confirm claim in MetaMask…");
      const hash = await writeContractAsync({
        address: marketAddress,
        abi: marketAbi,
        functionName: "claimWinnings",
        chainId: testBnbChain.id,
      });
      await waitForTransactionReceipt(wagmiConfig, {
        hash,
        chainId: testBnbChain.id,
      });
      return hash;
    },
    onError: (error) => {
      toast.error(formatChainTradeError(error));
    },
    onSuccess: () => {
      toast.success("Winnings claimed");
    },
  });
}
