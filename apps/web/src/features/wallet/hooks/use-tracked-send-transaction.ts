"use client";

import { useCallback } from "react";
import {
  type SendTransactionParameters,
  stringify,
  UserRejectedRequestError,
} from "viem";
import { useSendTransaction } from "wagmi";
import { toast } from "sonner";
import { useWalletUiStore } from "../store/wallet-ui.store";

/**
 * Native transfers / raw calldata sends with staged UI state + toast lifecycle.
 */
export function useTrackedSendTransaction() {
  const resetTx = useWalletUiStore((s) => s.resetTx);
  const setPhase = useWalletUiStore((s) => s.setTxPhase);
  const setHash = useWalletUiStore((s) => s.setTxHash);
  const setErr = useWalletUiStore((s) => s.setTxError);

  const mutation = useSendTransaction();

  const trackedSend = useCallback(
    async (args: SendTransactionParameters) => {
      resetTx();
      setPhase("preparing");
      try {
        setPhase("pending_wallet");
        const hash = await mutation.sendTransactionAsync(args);
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
        toast.error("Transaction failed", { description: msg });
        throw e;
      }
    },
    [mutation, resetTx, setErr, setHash, setPhase],
  );

  return {
    trackedSend,
    mutation,
    isSending: mutation.isPending,
  };
}
