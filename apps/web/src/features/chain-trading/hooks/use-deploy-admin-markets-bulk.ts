"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  encodeFunctionData,
  maxUint256,
  parseUnits,
  type Address,
  type TransactionReceipt,
} from "viem";
import { UserRejectedRequestError } from "viem";
import {
  getPublicClient,
  waitForTransactionReceipt,
} from "wagmi/actions";
import { waitForCallsStatus } from "@wagmi/core";
import { useAccount, useChainId, useSendCalls, useWriteContract } from "wagmi";
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

function formatDeployError(error: unknown): string {
  if (error instanceof UserRejectedRequestError) {
    return "Transaction cancelled";
  }
  return formatChainTradeError(error);
}

function isMissingSelectorError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return /function selector|unrecognized|does not exist|execution reverted/i.test(
    msg,
  );
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
    // Fall back to order if question strings diverge slightly.
    if (remaining.length > 0 && paired.length < markets.length) {
      const hit = remaining.splice(0, 1)[0];
      if (hit) paired.push({ id: m.id, slug: m.slug, address: hit.market });
    }
  }
  return paired;
}

/**
 * Deploy many admin markets with a single MetaMask confirmation when possible.
 * Prefers factory `createMarkets` (one tx). Falls back to EIP-5792 `sendCalls`
 * batching multiple `createMarket` calls.
 */
export function useDeployAdminMarketsBulk() {
  const { address } = useAccount();
  const chainId = useChainId();
  const { writeContractAsync } = useWriteContract();
  const { sendCallsAsync } = useSendCalls();
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

      const publicClient = getPublicClient(wagmiConfig, {
        chainId: testBnbChain.id,
      });
      if (!publicClient) {
        throw new Error("BSC testnet RPC client unavailable.");
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

      const needsApprove = totalPull > 0n && allowance < totalPull;

      const feeBps = inputs.map((i) => i.feeBps);
      const questions = inputs.map((i) => i.question);
      const resolutionSources = inputs.map((i) => i.resolutionSource);
      const categories = inputs.map((i) => i.category);
      const endTimes = inputs.map((i) => BigInt(i.endTimeUnix));

      // Path A: factory createMarkets — one MetaMask confirm (after optional approve).
      let receipt: TransactionReceipt | null = null;
      let txHash: `0x${string}` | undefined;

      const tryCreateMarkets = async (): Promise<TransactionReceipt | null> => {
        try {
          await publicClient.simulateContract({
            address: factory,
            abi: marketFactoryAbi,
            functionName: "createMarkets",
            args: [
              collateral,
              treasury,
              uma,
              feeBps,
              questions,
              resolutionSources,
              categories,
              endTimes,
              seedLs,
              rews,
              bonds,
              3600n,
            ],
            account: address,
          });
        } catch (e) {
          if (isMissingSelectorError(e)) return null;
          // Simulation may fail for other reasons (e.g. not owner) — still try sendCalls.
          return null;
        }

        if (needsApprove) {
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

        toast.message(
          `Confirm deploying ${markets.length} markets in MetaMask (one confirmation)…`,
        );
        const hash = await writeContractAsync({
          address: factory,
          abi: marketFactoryAbi,
          functionName: "createMarkets",
          args: [
            collateral,
            treasury,
            uma,
            feeBps,
            questions,
            resolutionSources,
            categories,
            endTimes,
            seedLs,
            rews,
            bonds,
            3600n,
          ],
          chainId: testBnbChain.id,
        });
        txHash = hash;
        const mined = await waitForTransactionReceipt(wagmiConfig, {
          hash,
          chainId: testBnbChain.id,
        });
        return mined.status === "success" ? mined : null;
      };

      receipt = await tryCreateMarkets();

      if (!receipt) {
        // Path B: EIP-5792 sendCalls — approve + N createMarket under one wallet UI.
        const calls: { to: Address; data: `0x${string}` }[] = [];

        if (needsApprove) {
          if (allowance > 0n) {
            calls.push({
              to: collateral,
              data: encodeFunctionData({
                abi: erc20Abi,
                functionName: "approve",
                args: [factory, 0n],
              }),
            });
          }
          calls.push({
            to: collateral,
            data: encodeFunctionData({
              abi: erc20Abi,
              functionName: "approve",
              args: [factory, maxUint256],
            }),
          });
        }

        for (let i = 0; i < markets.length; i++) {
          calls.push({
            to: factory,
            data: encodeFunctionData({
              abi: marketFactoryAbi,
              functionName: "createMarket",
              args: [
                collateral,
                treasury,
                uma,
                feeBps[i]!,
                questions[i]!,
                resolutionSources[i]!,
                categories[i]!,
                endTimes[i]!,
                seedLs[i]!,
                rews[i]!,
                bonds[i]!,
                3600n,
              ],
            }),
          });
        }

        toast.message(
          `Confirm deploying ${markets.length} markets in MetaMask (one confirmation)…`,
        );

        try {
          const { id } = await sendCallsAsync({
            chainId: testBnbChain.id,
            calls,
          });
          const status = await waitForCallsStatus(wagmiConfig, {
            id,
            timeout: 180_000,
          });
          if (status.status !== "success") {
            throw new Error("Batch deployment did not confirm.");
          }
          const receipts = (status.receipts ?? []) as TransactionReceipt[];
          const events = receipts.flatMap((r) =>
            parseMarketCreatedEvents(r, factory),
          );
          if (events.length === 0) {
            throw new Error("No MarketCreated events found in batch receipts.");
          }
          const paired = matchAddressesToMarkets(markets, events);
          for (const p of paired) {
            await persistDeployAddress(p.id, p.address);
          }
          txHash = receipts[0]?.transactionHash;
          return { ok: paired.length, total: markets.length, txHash };
        } catch (e) {
          if (e instanceof UserRejectedRequestError) throw e;
          throw new Error(
            `${formatDeployError(e)} — Redeploy MarketFactory with createMarkets, or use a wallet that supports batched calls (EIP-5792).`,
          );
        }
      }

      const events = parseMarketCreatedEvents(receipt, factory);
      if (events.length === 0) {
        throw new Error("Could not read MarketCreated events from receipt.");
      }

      const paired = matchAddressesToMarkets(markets, events);
      for (const p of paired) {
        await persistDeployAddress(p.id, p.address);
      }

      return { ok: paired.length, total: markets.length, txHash };
    },
    onSuccess: (res, markets) => {
      toast.success(
        `Deployed ${res.ok} of ${res.total} markets with one confirmation. Users can trade them now.`,
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
