"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { maxUint256, parseUnits, type Address } from "viem";
import { getPublicClient, waitForTransactionReceipt } from "wagmi/actions";
import { useAccount, useChainId, useWriteContract } from "wagmi";
import { wagmiConfig } from "@/providers/web3/wagmi-config";
import { testBnbChain } from "@/providers/web3/chains";
import { erc20Abi } from "../abis/erc20";
import { marketFactoryAbi } from "../abis/market-factory";
import {
  collateralDecimals,
  getCollateralAddress,
  getFactoryAddress,
  getTreasuryAddress,
  getUmaOracleAddress,
  isChainEnvConfigured,
  chainEnvConfigErrorMessage,
} from "../lib/chain-contract-env";
import { parseMarketCreatedAddress } from "../lib/parse-market-created";

export type DeployOnChainMarketInput = {
  question: string;
  resolutionSource: string;
  /** 0 = FDV, 1 = Narrative, 2 = Event */
  category: 0 | 1 | 2;
  endTimeUnix: number;
  seedLiquidityUsd: string;
  assertionRewardUsd: string;
  requiredBondUsd: string;
  /** Trading fee in bps (max 200 on-chain). */
  feeBps: number;
};

export type DeployOnChainMarketResult = {
  marketAddress: Address;
  txHash: `0x${string}`;
  chainId: number;
};

export function useDeployOnChainMarket() {
  const { address } = useAccount();
  const chainId = useChainId();
  const { writeContractAsync } = useWriteContract();

  return useMutation({
    mutationKey: ["chain", "deploy-market"],
    mutationFn: async (
      input: DeployOnChainMarketInput,
    ): Promise<DeployOnChainMarketResult> => {
      if (!address) throw new Error("Connect MetaMask to deploy on-chain markets.");
      if (chainId !== testBnbChain.id) {
        throw new Error("Switch MetaMask to BNB Smart Chain (chain 97).");
      }
      if (!isChainEnvConfigured()) {
        throw new Error(chainEnvConfigErrorMessage() || "On-chain env missing.");
      }

      const factory = getFactoryAddress()!;
      const collateral = getCollateralAddress()!;
      const treasury = getTreasuryAddress()!;
      const uma = getUmaOracleAddress()!;
      const decimals = collateralDecimals();

      const seedL = parseUnits(input.seedLiquidityUsd.trim() || "0", decimals);
      const rew = parseUnits(input.assertionRewardUsd.trim() || "0", decimals);
      const rb = parseUnits(input.requiredBondUsd.trim() || "0", decimals);
      const pull = seedL + rew;

      const publicClient = getPublicClient(wagmiConfig, { chainId: testBnbChain.id });
      if (!publicClient) {
        throw new Error("BSC testnet RPC client unavailable.");
      }

      if (pull > 0n) {
        const bal = await publicClient.readContract({
          address: collateral,
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [address],
        });
        if (bal < pull) {
          throw new Error(
            `Insufficient collateral. Need ${input.seedLiquidityUsd} seed + ${input.assertionRewardUsd} reward in wallet.`,
          );
        }

        const allowance = await publicClient.readContract({
          address: collateral,
          abi: erc20Abi,
          functionName: "allowance",
          args: [address, factory],
        });

        if (allowance < pull) {
          if (allowance > 0n) {
            const resetHash = await writeContractAsync({
              address: collateral,
              abi: erc20Abi,
              functionName: "approve",
              args: [factory, 0n],
              chainId: testBnbChain.id,
            });
            await waitForTransactionReceipt(wagmiConfig, {
              hash: resetHash,
              chainId: testBnbChain.id,
            });
          }
          toast.message("Approve collateral in MetaMask…");
          const approveHash = await writeContractAsync({
            address: collateral,
            abi: erc20Abi,
            functionName: "approve",
            args: [factory, maxUint256],
            chainId: testBnbChain.id,
          });
          await waitForTransactionReceipt(wagmiConfig, {
            hash: approveHash,
            chainId: testBnbChain.id,
          });
        }
      }

      const createArgs = [
        collateral,
        treasury,
        uma,
        input.feeBps,
        input.question,
        input.resolutionSource,
        input.category,
        BigInt(input.endTimeUnix),
        seedL,
        rew,
        rb,
        3600n,
      ] as const;

      toast.message("Confirm market deployment in MetaMask…");
      const hash = await writeContractAsync({
        address: factory,
        abi: marketFactoryAbi,
        functionName: "createMarket",
        args: [...createArgs],
        chainId: testBnbChain.id,
      });

      const receipt = await waitForTransactionReceipt(wagmiConfig, {
        hash,
        chainId: testBnbChain.id,
      });

      if (receipt.status !== "success") {
        throw new Error("Market deployment transaction reverted.");
      }

      const marketAddress = parseMarketCreatedAddress(receipt, factory);
      if (!marketAddress) {
        throw new Error("Could not read MarketCreated address from receipt.");
      }

      return { marketAddress, txHash: hash, chainId: testBnbChain.id };
    },
  });
}
