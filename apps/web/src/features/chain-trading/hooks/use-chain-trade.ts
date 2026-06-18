"use client";

import { useMutation } from "@tanstack/react-query";
import { waitForTransactionReceipt } from "wagmi/actions";
import { useWriteContract } from "wagmi";
import { wagmiConfig } from "@/providers/web3/wagmi-config";
import { testBnbChain } from "@/providers/web3/chains";
import { useWalletUiStore } from "@/features/wallet/store/wallet-ui.store";
import { marketAbi } from "../abis/market";
import { getChainMarketTradeAddress } from "../config/contracts";
import { formatChainTradeError } from "../lib/format-trade-error";
import type { TradeOutcomeSide } from "../lib/outcome";

export type ChainTradeBuyArgs = {
  /** Market clone contract address (from factory / indexer). */
  marketAddress?: `0x${string}`;
  outcome: TradeOutcomeSide;
  /** Collateral amount in token wei (6 decimals for USDC/tUSDT). */
  collateralWei: bigint;
  /** Minimum outcome tokens out (slippage); 0 accepts any. */
  minOutWei?: bigint;
};

/**
 * Imperative **buy YES / buy NO** via Market.sol `buyYes` / `buyNo`.
 */
export function useChainTradeBuy() {
  const { writeContractAsync } = useWriteContract();
  const resetTx = useWalletUiStore((s) => s.resetTx);
  const setPhase = useWalletUiStore((s) => s.setTxPhase);
  const setHash = useWalletUiStore((s) => s.setTxHash);
  const setErr = useWalletUiStore((s) => s.setTxError);

  return useMutation({
    mutationKey: ["chain-trade", "buyYesNo"],
    mutationFn: async (args: ChainTradeBuyArgs) => {
      const contract = args.marketAddress ?? getChainMarketTradeAddress();
      if (!contract) {
        throw new Error(
          "On-chain trading disabled — set NEXT_PUBLIC_CHAIN_MARKET_TRADE_ADDRESS or marketAddress",
        );
      }

      const fn = args.outcome === "YES" ? "buyYes" : "buyNo";
      const minOut = args.minOutWei ?? 0n;

      resetTx();
      setPhase("preparing");

      try {
        setPhase("pending_wallet");
        const hash = await writeContractAsync({
          address: contract,
          abi: marketAbi,
          functionName: fn,
          args: [args.collateralWei, minOut],
          chainId: testBnbChain.id,
        });

        setHash(hash);
        setPhase("submitted");

        setPhase("confirming");
        const receipt = await waitForTransactionReceipt(wagmiConfig, {
          hash,
          chainId: testBnbChain.id,
        });

        if (receipt.status !== "success") {
          throw new Error("Transaction reverted");
        }

        setPhase("success");

        return { hash, receipt };
      } catch (e) {
        const msg = formatChainTradeError(e);
        setErr(msg);
        setPhase("error");
        throw e;
      }
    },
  });
}
