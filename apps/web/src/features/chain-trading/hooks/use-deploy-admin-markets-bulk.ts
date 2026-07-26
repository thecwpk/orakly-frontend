"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  maxUint256,
  parseUnits,
  toFunctionSelector,
  type Address,
  type TransactionReceipt,
} from "viem";
import { UserRejectedRequestError } from "viem";
import {
  getPublicClient,
  waitForTransactionReceipt,
} from "wagmi/actions";
import { useAccount, useChainId, useWriteContract } from "wagmi";
import {
  invalidateMarketsFeed,
  invalidateMarketLive,
} from "@/shared/api/invalidate";
import { queryKeys } from "@/shared/api/query-keys";
import { testBnbChain } from "@/providers/web3/chains";
import { wagmiConfig } from "@/providers/web3/wagmi-config";
import { erc20Abi } from "../abis/erc20";
import { marketFactoryAbi } from "../abis/market-factory";
import {
  chainEnvConfigErrorMessage,
  collateralDecimals,
  getCollateralAddress,
  getFactoryAddress,
  getTreasuryAddress,
  getUmaOracleAddress,
  isChainEnvConfigured,
} from "../lib/chain-contract-env";
import { formatChainTradeError } from "../lib/format-trade-error";
import {
  marketRecordToDeployInput,
  type DeployableMarketRecord,
} from "../lib/market-to-deploy-input";
import { parseMarketCreatedEvents } from "../lib/parse-market-created";
import type { DeployAdminMarketInput } from "./use-deploy-admin-market";

export type BulkDeployResult = {
  ok: number;
  total: number;
  txHash?: `0x${string}`;
};

/** Keep each createMarkets tx under typical wallet / block gas comfort. */
const CREATE_MARKETS_CHUNK = 5;

const CREATE_MARKETS_SELECTOR = toFunctionSelector({
  type: "function",
  name: "createMarkets",
  stateMutability: "nonpayable",
  inputs: [
    { name: "collateral", type: "address" },
    { name: "treasury", type: "address" },
    { name: "optimisticOracle", type: "address" },
    { name: "feeBps", type: "uint16[]" },
    { name: "questions", type: "string[]" },
    { name: "resolutionSources", type: "string[]" },
    { name: "categories", type: "uint8[]" },
    { name: "endTimes", type: "uint256[]" },
    { name: "seedLiquidities", type: "uint256[]" },
    { name: "assertionRewards", type: "uint256[]" },
    { name: "requiredBonds", type: "uint256[]" },
    { name: "assertionLiveness", type: "uint64" },
  ],
  outputs: [{ name: "markets", type: "address[]" }],
});

function formatDeployError(error: unknown): string {
  if (error instanceof UserRejectedRequestError) {
    return "Transaction cancelled";
  }
  return formatChainTradeError(error);
}

async function factorySupportsCreateMarkets(
  publicClient: NonNullable<ReturnType<typeof getPublicClient>>,
  factory: Address,
): Promise<boolean> {
  const code = await publicClient.getBytecode({ address: factory });
  if (!code || code === "0x") return false;
  // Runtime bytecode includes the 4-byte selector in the dispatcher.
  return code.toLowerCase().includes(CREATE_MARKETS_SELECTOR.slice(2).toLowerCase());
}

async function persistDeployAddress(
  marketId: string,
  onChainAddress: Address,
): Promise<void> {
  const res = await fetch(`/api/v1/admin/markets/${marketId}/deploy`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ onChainAddress }),
  });
  const payload = (await res.json()) as { error?: string };
  if (!res.ok) {
    throw new Error(payload.error ?? "Failed to save on-chain address");
  }
}

function matchAddressesToMarkets(
  markets: DeployAdminMarketInput[],
  events: { market: Address; question: string }[],
): Array<{ id: string; slug?: string; address: Address }> {
  const remaining = [...events];
  const paired: Array<{ id: string; slug?: string; address: Address }> = [];

  for (const m of markets) {
    const q = m.title.trim().toLowerCase();
    const idx = remaining.findIndex(
      (e) => e.question.trim().toLowerCase() === q,
    );
    if (idx >= 0) {
      const hit = remaining.splice(idx, 1)[0];
      if (hit) paired.push({ id: m.id, slug: m.slug, address: hit.market });
      continue;
    }
    if (remaining.length > 0 && paired.length < markets.length) {
      const hit = remaining.splice(0, 1)[0];
      if (hit) paired.push({ id: m.id, slug: m.slug, address: hit.market });
    }
  }
  return paired;
}

function chunkIndices(total: number, size: number): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  for (let i = 0; i < total; i += size) {
    out.push([i, Math.min(i + size, total)]);
  }
  return out;
}

/**
 * Deploy many admin markets via factory `createMarkets` (one MetaMask confirm per chunk).
 * Requires an upgraded MarketFactory — no oversized wallet_sendCalls fallback.
 */
export function useDeployAdminMarketsBulk() {
  const { address } = useAccount();
  const chainId = useChainId();
  const { writeContractAsync } = useWriteContract();
  const qc = useQueryClient();

  return useMutation({
    mutationKey: ["chain", "deploy-admin-markets-bulk"],
    mutationFn: async (
      markets: DeployAdminMarketInput[],
    ): Promise<BulkDeployResult> => {
      if (markets.length === 0) {
        throw new Error("Select at least one undeployed market.");
      }
      if (!address) throw new Error("Connect admin wallet first");
      if (chainId !== testBnbChain.id) {
        throw new Error("Switch to BNB Smart Chain (Chain ID 97)");
      }
      if (!isChainEnvConfigured()) {
        throw new Error(chainEnvConfigErrorMessage() || "On-chain env missing.");
      }

      const factory = getFactoryAddress()!;
      const collateral = getCollateralAddress()!;
      const treasury = getTreasuryAddress()!;
      const uma = getUmaOracleAddress()!;
      const decimals = collateralDecimals();

      const publicClient = getPublicClient(wagmiConfig, {
        chainId: testBnbChain.id,
      });
      if (!publicClient) {
        throw new Error("BSC testnet RPC client unavailable.");
      }

      const supportsBatch = await factorySupportsCreateMarkets(
        publicClient,
        factory,
      );
      if (!supportsBatch) {
        throw new Error(
          `Factory ${factory.slice(0, 8)}… does not support createMarkets. Click “Upgrade factory (bulk)” first, confirm the 2 MetaMask deploys, then retry bulk deploy.`,
        );
      }

      const inputs = markets.map((m) =>
        marketRecordToDeployInput(m as DeployableMarketRecord),
      );

      let totalPull = 0n;
      const seedLs: bigint[] = [];
      const rews: bigint[] = [];
      const bonds: bigint[] = [];
      for (const input of inputs) {
        const seedL = parseUnits(input.seedLiquidityUsd.trim() || "0", decimals);
        const rew = parseUnits(input.assertionRewardUsd.trim() || "0", decimals);
        const rb = parseUnits(input.requiredBondUsd.trim() || "0", decimals);
        seedLs.push(seedL);
        rews.push(rew);
        bonds.push(rb);
        totalPull += seedL + rew;
      }

      if (totalPull > 0n) {
        const bal = await publicClient.readContract({
          address: collateral,
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [address],
        });
        if (bal < totalPull) {
          throw new Error(
            `Insufficient collateral for ${markets.length} markets. Need more seed + reward in wallet.`,
          );
        }
      }

      const allowance = await publicClient.readContract({
        address: collateral,
        abi: erc20Abi,
        functionName: "allowance",
        args: [address, factory],
      });

      if (totalPull > 0n && allowance < totalPull) {
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
        toast.message("Approve collateral once for the whole batch…");
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

      const feeBps = inputs.map((i) => i.feeBps);
      const questions = inputs.map((i) => i.question);
      const resolutionSources = inputs.map((i) => i.resolutionSource);
      const categories = inputs.map((i) => i.category);
      const endTimes = inputs.map((i) => BigInt(i.endTimeUnix));

      const ranges = chunkIndices(markets.length, CREATE_MARKETS_CHUNK);
      let ok = 0;
      let lastTx: `0x${string}` | undefined;

      for (let c = 0; c < ranges.length; c++) {
        const [start, end] = ranges[c]!;
        const sliceMarkets = markets.slice(start, end);
        const n = end - start;

        toast.message(
          ranges.length === 1
            ? `Confirm deploying ${n} markets in MetaMask (one confirmation)…`
            : `Confirm chunk ${c + 1}/${ranges.length} (${n} markets) in MetaMask…`,
        );

        const hash = await writeContractAsync({
          address: factory,
          abi: marketFactoryAbi,
          functionName: "createMarkets",
          args: [
            collateral,
            treasury,
            uma,
            feeBps.slice(start, end),
            questions.slice(start, end),
            resolutionSources.slice(start, end),
            categories.slice(start, end),
            endTimes.slice(start, end),
            seedLs.slice(start, end),
            rews.slice(start, end),
            bonds.slice(start, end),
            3600n,
          ],
          chainId: testBnbChain.id,
        });
        lastTx = hash;

        const receipt: TransactionReceipt = await waitForTransactionReceipt(
          wagmiConfig,
          { hash, chainId: testBnbChain.id },
        );
        if (receipt.status !== "success") {
          throw new Error(`Chunk ${c + 1} deployment reverted.`);
        }

        const events = parseMarketCreatedEvents(receipt, factory);
        if (events.length === 0) {
          throw new Error(
            `Chunk ${c + 1}: could not read MarketCreated events from receipt.`,
          );
        }

        const paired = matchAddressesToMarkets(sliceMarkets, events);
        for (const p of paired) {
          await persistDeployAddress(p.id, p.address);
        }
        ok += paired.length;
      }

      return { ok, total: markets.length, txHash: lastTx };
    },
    onSuccess: (res, markets) => {
      toast.success(
        `Deployed ${res.ok} of ${res.total} markets. Users can trade them now.`,
      );
      void qc.invalidateQueries({ queryKey: ["admin", "markets"] });
      invalidateMarketsFeed(qc);
      for (const m of markets) {
        invalidateMarketLive(qc, m.id, { includeFeed: true });
        if (m.slug) {
          void qc.invalidateQueries({
            queryKey: queryKeys.markets.bySlug(m.slug),
          });
        }
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
