"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useWalletSessionQuery } from "@/features/wallet/hooks/use-wallet-session-query";
import {
  adminBootstrapFromWallet,
  adminMeQueryKey,
  hasAdminSessionCookie,
} from "../lib/admin-api";

export type AdminWalletBootstrapState =
  | "idle"
  | "booting"
  | "ready"
  | "needs_wallet"
  | "failed";

function isWalletOperator(role: string | null | undefined): boolean {
  return role === "ADMIN" || role === "MODERATOR";
}

/**
 * When an operator wallet is signed in, mint the HttpOnly admin cookie without
 * the bootstrap token form.
 */
export function useAdminWalletBootstrap(nextPath = "/admin/dashboard") {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: walletSession, isFetched: walletFetched } = useWalletSessionQuery();
  const attemptedRef = useRef(false);
  const [state, setState] = useState<AdminWalletBootstrapState>(() =>
    hasAdminSessionCookie() ? "ready" : "idle",
  );

  const walletOperator = isWalletOperator(walletSession?.role);

  const bootstrap = useCallback(async (): Promise<boolean> => {
    if (hasAdminSessionCookie()) {
      setState("ready");
      return true;
    }

    if (!walletOperator) {
      setState("needs_wallet");
      return false;
    }

    setState("booting");
    try {
      await adminBootstrapFromWallet();
      await queryClient.invalidateQueries({ queryKey: adminMeQueryKey });
      setState("ready");
      return true;
    } catch {
      setState("failed");
      return false;
    }
  }, [queryClient, walletOperator]);

  useEffect(() => {
    if (hasAdminSessionCookie()) {
      setState("ready");
      return;
    }
    if (!walletFetched || attemptedRef.current) return;

    if (!walletOperator) {
      setState("needs_wallet");
      return;
    }

    attemptedRef.current = true;
    void bootstrap().then((ok) => {
      if (ok) router.replace(nextPath);
    });
  }, [bootstrap, nextPath, router, walletFetched, walletOperator]);

  return { state, walletOperator, bootstrap };
}
