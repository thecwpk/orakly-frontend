"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useWalletUiStore } from "@/features/wallet/store/wallet-ui.store";

/**
 * Optional secondary UX layer: duplicate toast when global tx store enters confirming (e.g. header indicators).
 * Safe no-op if you rely solely on `useChainTradeBuy` toasts.
 */
export function useMirrorWalletTxToasts(enabled = false) {
  const phase = useWalletUiStore((s) => s.txPhase);
  const hash = useWalletUiStore((s) => s.txHash);
  const notified = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !hash) return;
    if (phase === "confirming" && notified.current !== hash) {
      notified.current = hash;
      toast.loading("Waiting for confirmations…", {
        id: `tx-${hash}`,
        description: `${hash.slice(0, 10)}…`,
      });
    }
    if (phase === "success" || phase === "error") {
      toast.dismiss(`tx-${hash}`);
    }
  }, [enabled, hash, phase]);
}
