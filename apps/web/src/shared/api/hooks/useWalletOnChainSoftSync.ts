"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { postWalletOnChainSync } from "../fetchers/wallet-onchain";
import { queryKeys } from "../query-keys";

const STALE_AFTER_MS = 55_000;

/**
 * Soft refresh when snapshot is missing or older than `STALE_AFTER_MS`.
 * Server cooldown avoids RPC spikes; we only invalidate React Query after a successful write.
 */
export function useWalletOnChainSoftSync(
  userId: string | undefined,
  syncedAtIso: string | null | undefined,
) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    const stale =
      !syncedAtIso ||
      Date.now() - new Date(syncedAtIso).getTime() > STALE_AFTER_MS;

    if (!stale) return;

    const t = window.setTimeout(() => {
      void postWalletOnChainSync(false).then((r) => {
        if (r.ok && !r.skipped) {
          void qc.invalidateQueries({
            queryKey: queryKeys.portfolio.byUser(userId),
          });
        }
      });
    }, 700);

    return () => window.clearTimeout(t);
  }, [userId, syncedAtIso, qc]);
}
