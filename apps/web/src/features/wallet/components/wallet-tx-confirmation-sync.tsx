"use client";

import { useEffect, useRef } from "react";
import { useWaitForTransactionReceipt } from "wagmi";
import { toast } from "sonner";
import { tbnbChain } from "../config/chains";
import { useWalletUiStore } from "../store/wallet-ui.store";

/**
 * Bridges wagmi receipt polling to the shared wallet UI store (single toast per hash).
 * Mount once under app providers.
 */
export function WalletTxConfirmationSync() {
  const txHash = useWalletUiStore((s) => s.txHash);
  const setPhase = useWalletUiStore((s) => s.setTxPhase);
  const setErr = useWalletUiStore((s) => s.setTxError);

  const successRef = useRef<string | null>(null);
  const errorRef = useRef<string | null>(null);

  const receipt = useWaitForTransactionReceipt({
    hash: txHash ?? undefined,
    chainId: tbnbChain.id,
    query: {
      enabled: Boolean(txHash),
    },
  });

  useEffect(() => {
    if (!txHash) {
      successRef.current = null;
      errorRef.current = null;
      return;
    }
    if (receipt.isFetching || receipt.isLoading) {
      setPhase("confirming");
    }
  }, [
    receipt.isFetching,
    receipt.isLoading,
    setPhase,
    txHash,
  ]);

  useEffect(() => {
    if (!txHash || !receipt.isSuccess || successRef.current === txHash) {
      return;
    }
    successRef.current = txHash;
    setPhase("success");
    toast.success("Confirmed on-chain", {
      description: `${txHash.slice(0, 8)}…`,
    });
  }, [receipt.isSuccess, setPhase, txHash]);

  useEffect(() => {
    if (!txHash || !receipt.isError || errorRef.current === txHash) {
      return;
    }
    errorRef.current = txHash;
    const msg =
      receipt.error instanceof Error ?
        receipt.error.message
      : "Confirmation failed";
    setErr(msg);
    setPhase("error");
    toast.error("Confirmation failed", { description: msg });
  }, [receipt.error, receipt.isError, setErr, setPhase, txHash]);

  return null;
}
