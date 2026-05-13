"use client";

import { useCallback } from "react";
import { stringify, UserRejectedRequestError } from "viem";
import { useWriteContract } from "wagmi";
import { toast } from "sonner";
import { useWalletUiStore } from "../store/wallet-ui.store";

/**
 * Contract writes with shared UI phases (pairs with `WalletTxConfirmationSync`).
 */
export function useTrackedWriteContract() {
  const resetTx = useWalletUiStore((s) => s.resetTx);
  const setPhase = useWalletUiStore((s) => s.setTxPhase);
  const setHash = useWalletUiStore((s) => s.setTxHash);
  const setErr = useWalletUiStore((s) => s.setTxError);

  const wc = useWriteContract();

  const trackedWrite = useCallback(
    async (
      args: Parameters<NonNullable<typeof wc.writeContractAsync>>[0],
    ) => {
      if (!wc.writeContractAsync) {
        throw new Error("Wallet writer unavailable");
      }
      resetTx();
      setPhase("preparing");
      try {
        setPhase("pending_wallet");
        const hash = await wc.writeContractAsync(args);
        setHash(hash);
        setPhase("submitted");
        toast.message("Transaction submitted", {
          description: `${hash.slice(0, 8)}…`,
        });
        return hash;
      } catch (e) {
        const msg =
          e instanceof UserRejectedRequestError
            ? "Rejected in wallet"
            : e instanceof Error
              ? e.message
              : stringify(e);
        setErr(msg);
        setPhase("error");
        toast.error("Contract call failed", { description: msg });
        throw e;
      }
    },
    [resetTx, setErr, setHash, setPhase, wc],
  );

  return { trackedWrite, mutation: wc, isWriting: wc.isPending };
}
