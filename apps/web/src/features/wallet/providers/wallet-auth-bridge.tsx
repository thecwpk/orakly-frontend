"use client";

import {
  createAuthenticationAdapter,
  RainbowKitAuthenticationProvider,
} from "@rainbow-me/rainbowkit";
import type { AuthenticationStatus } from "@rainbow-me/rainbowkit";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, type ReactNode } from "react";
import { useAccount } from "wagmi";
import { getAccount } from "wagmi/actions";
import { wagmiConfig } from "@/providers/web3/wagmi-config";
import { tbnbChain } from "../config/chains";
import { buildWalletAuthMessage } from "../lib/auth-message";
import { WalletAutoSignIn } from "../components/wallet-auto-sign-in";
import {
  useWalletSessionQuery,
  walletSessionQueryKey,
} from "../hooks/use-wallet-session-query";
import { adminMeQueryKey } from "@/widgets/admin-dashboard/lib/admin-api";

export function WalletAuthBridge({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { address } = useAccount();
  const { data: session, isPending } = useWalletSessionQuery();

  const status: AuthenticationStatus =
    isPending ? "loading"
    : session && address &&
        session.address.toLowerCase() === address.toLowerCase() ?
      "authenticated"
    : "unauthenticated";

  const adapter = useMemo(
    () =>
      createAuthenticationAdapter({
        getNonce: async () => {
          const addr = getAccount(wagmiConfig).address;
          if (!addr) {
            throw new Error("Connect a wallet before signing in");
          }
          const res = await fetch("/api/v1/wallet/auth/nonce", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ address: addr }),
          });
          const j = (await res.json()) as {
            ok?: boolean;
            data?: { nonce: string };
            error?: { message?: string };
          };
          if (!res.ok || !j.ok || !j.data?.nonce) {
            throw new Error(j.error?.message ?? "Could not issue nonce");
          }
          return j.data.nonce;
        },
        createMessage: ({ nonce, address: addr, chainId: cid }) => {
          const host =
            typeof window !== "undefined" ? window.location.host : "localhost";
          return buildWalletAuthMessage({
            address: addr,
            chainId: cid,
            nonce,
            host,
          });
        },
        verify: async ({ message, signature }) => {
          const account = getAccount(wagmiConfig);
          const addr = account.address;
          if (!addr) return false;
          const res = await fetch("/api/v1/wallet/auth/verify", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message,
              signature,
              address: addr,
              chainId: account.chainId ?? tbnbChain.id,
            }),
          });
          const j = (await res.json().catch(() => null)) as {
            ok?: boolean;
          } | null;
          if (!res.ok || !j?.ok) return false;
          await queryClient.invalidateQueries({ queryKey: walletSessionQueryKey });
          await queryClient.invalidateQueries({ queryKey: adminMeQueryKey });
          return true;
        },
        signOut: async () => {
          await fetch("/api/v1/wallet/auth/session", {
            method: "DELETE",
            credentials: "include",
          });
          await queryClient.invalidateQueries({ queryKey: walletSessionQueryKey });
          await queryClient.invalidateQueries({ queryKey: adminMeQueryKey });
        },
      }),
    [queryClient],
  );

  return (
    <RainbowKitAuthenticationProvider adapter={adapter} status={status}>
      <WalletAutoSignIn />
      {children}
    </RainbowKitAuthenticationProvider>
  );
}
