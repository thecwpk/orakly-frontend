"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Address } from "viem";
import { getPublicClient, waitForTransactionReceipt } from "wagmi/actions";
import { useAccount, useChainId, useWriteContract } from "wagmi";
import { wagmiConfig } from "@/providers/web3/wagmi-config";
import { testBnbChain } from "@/providers/web3/chains";
import { erc20Abi } from "../abis/erc20";
import { marketAbi } from "../abis/market";
import {
  getCollateralAddress,
} from "../lib/chain-contract-env";
import { formatChainTradeError } from "../lib/format-trade-error";

const SLIPPAGE_BPS = 500n; // 5%

function applySlippage(amount: bigint): bigint {
  return (amount * (10_000n - SLIPPAGE_BPS)) / 10_000n;
}

export type ChainMarketExecutionInput = {
  marketAddress: Address;
  outcome: "YES" | "NO";
  direction: "BUY" | "SELL";
  /** Collateral wei for BUY; outcome token wei for SELL */
  amountWei: bigint;
};

export type ChainMarketExecutionResult = {
  txHash: `0x${string}`;
};

/**
 * MetaMask trade path — ERC20 approve (buy) then Market.sol buy/sell.
 */
export function useChainMarketExecution() {
  const { address } = useAccount();
  const chainId = useChainId();
  const { writeContractAsync } = useWriteContract();

  return useMutation({
    mutationKey: ["chain", "market-execution"],
    mutationFn: async (
      input: ChainMarketExecutionInput,
    ): Promise<ChainMarketExecutionResult> => {
      if (!address) throw new Error("Connect MetaMask to trade.");
      if (chainId !== testBnbChain.id) {
        throw new Error("Switch MetaMask to BNB Smart Chain Testnet (chain 97).");
      }
      if (input.amountWei <= 0n) throw new Error("Trade amount must be greater than zero.");

      const collateral = getCollateralAddress();
      if (!collateral) throw new Error("Collateral token not configured.");

      const publicClient = getPublicClient(wagmiConfig, { chainId: testBnbChain.id });
      if (!publicClient) {
        throw new Error("BSC testnet RPC client unavailable.");
      }

      if (input.direction === "BUY") {
        const feeBps = (await publicClient.readContract({
          address: input.marketAddress,
          abi: marketAbi,
          functionName: "feeBps",
        })) as number;
        const net =
          input.amountWei -
          (input.amountWei * BigInt(feeBps)) / 10_000n;

        const previewFn = input.outcome === "YES" ? "previewBuyYes" : "previewBuyNo";
        const previewOut = (await publicClient.readContract({
          address: input.marketAddress,
          abi: marketAbi,
          functionName: previewFn,
          args: [net],
        })) as bigint;
        const minOut = applySlippage(previewOut);

        const allowance = await publicClient.readContract({
          address: collateral,
          abi: erc20Abi,
          functionName: "allowance",
          args: [address, input.marketAddress],
        });

        if (allowance < input.amountWei) {
          toast.message("Approve collateral in MetaMask…");
          const approveHash = await writeContractAsync({
            address: collateral,
            abi: erc20Abi,
            functionName: "approve",
            args: [input.marketAddress, input.amountWei * 2n],
            chainId: testBnbChain.id,
          });
          await waitForTransactionReceipt(wagmiConfig, {
            hash: approveHash,
            chainId: testBnbChain.id,
          });
        }

        const fn = input.outcome === "YES" ? "buyYes" : "buyNo";
        toast.message(`Confirm BUY ${input.outcome} in MetaMask…`);
        const hash = await writeContractAsync({
          address: input.marketAddress,
          abi: marketAbi,
          functionName: fn,
          args: [input.amountWei, minOut],
          chainId: testBnbChain.id,
        });
        const receipt = await waitForTransactionReceipt(wagmiConfig, {
          hash,
          chainId: testBnbChain.id,
        });
        if (receipt.status !== "success") throw new Error("Trade transaction reverted.");
        return { txHash: hash };
      }

      const previewFn =
        input.outcome === "YES" ? "previewSellYesOut" : "previewSellNoOut";
      const sellQuote = (await publicClient.readContract({
        address: input.marketAddress,
        abi: marketAbi,
        functionName: previewFn,
        args: [input.amountWei],
      })) as readonly [bigint, bigint];
      const minOut = applySlippage(sellQuote[0]);

      const fn = input.outcome === "YES" ? "sellYes" : "sellNo";
      toast.message(`Confirm SELL ${input.outcome} in MetaMask…`);
      const hash = await writeContractAsync({
        address: input.marketAddress,
        abi: marketAbi,
        functionName: fn,
        args: [input.amountWei, minOut],
        chainId: testBnbChain.id,
      });
      const receipt = await waitForTransactionReceipt(wagmiConfig, {
        hash,
        chainId: testBnbChain.id,
      });
      if (receipt.status !== "success") throw new Error("Trade transaction reverted.");
      return { txHash: hash };
    },
    onError: (e) => {
      toast.error(formatChainTradeError(e));
    },
  });
}
