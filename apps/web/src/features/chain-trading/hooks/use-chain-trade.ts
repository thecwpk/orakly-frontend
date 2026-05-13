"use client";

import { useMutation } from "@tanstack/react-query";
import { waitForTransactionReceipt } from "wagmi/actions";
import { useWriteContract } from "wagmi";
import { wagmiConfig } from "@/providers/web3/wagmi-config";
import { testBnbChain } from "@/providers/web3/chains";
import { useWalletUiStore } from "@/features/wallet/store/wallet-ui.store";
import { chainMarketTradeAbi } from "../abis/market-trade";
import { getChainMarketTradeAddress } from "../config/contracts";
import { formatChainTradeError } from "../lib/format-trade-error";
import { outcomeToChainUint8, type TradeOutcomeSide } from "../lib/outcome";

export type ChainTradeBuyArgs = {
  /** On-chain market id (uint256) — map from app models via indexer/API metadata. */
  onChainMarketId: bigint;
  outcome: TradeOutcomeSide;
  /** Share / collateral units in wei — match contract decimals. */
  quantityWei: bigint;
};

/**
 * Imperative **buy YES / buy NO** via `buyOutcomeShares`: wallet prompt → broadcast → receipt → toast.
 * Uses shared `useWalletUiStore` phases + `WalletTxConfirmationSync` already mounted in app shell.
 */
export function useChainTradeBuy() {
  const { writeContractAsync } = useWriteContract();
  const resetTx = useWalletUiStore((s) => s.resetTx);
  const setPhase = useWalletUiStore((s) => s.setTxPhase);
  const setHash = useWalletUiStore((s) => s.setTxHash);
  const setErr = useWalletUiStore((s) => s.setTxError);

  return useMutation({
    mutationKey: ["chain-trade", "buyOutcomeShares"],
    mutationFn: async (args: ChainTradeBuyArgs) => {
      const contract = getChainMarketTradeAddress();
      if (!contract) {
        throw new Error(
          "On-chain trading disabled — set NEXT_PUBLIC_CHAIN_MARKET_TRADE_ADDRESS",
        );
      }

      resetTx();
      setPhase("preparing");

      try {
        setPhase("pending_wallet");
        const hash = await writeContractAsync({
          address: contract,
          abi: chainMarketTradeAbi,
          functionName: "buyOutcomeShares",
          args: [
            args.onChainMarketId,
            outcomeToChainUint8(args.outcome),
            args.quantityWei,
          ],
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
