"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Address } from "viem";
import { walletSessionQueryKey } from "./use-wallet-session-query";

const noncePath = "/api/v1/wallet/auth/nonce";
const verifyPath = "/api/v1/wallet/auth/verify";
const sessionPath = "/api/v1/wallet/auth/session";

type ApiEnvelope<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code?: string; message?: string } };

async function parseEnvelope<T>(res: Response): Promise<ApiEnvelope<T>> {
  return (await res.json()) as ApiEnvelope<T>;
}

/**
 * Request a DB-backed nonce bound to the wallet (call after user connects MetaMask).
 */
export function useWalletAuthNonceMutation() {
  return useMutation({
    mutationKey: ["wallet-auth", "nonce"],
    mutationFn: async (address: Address) => {
      const res = await fetch(noncePath, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });
      const body = await parseEnvelope<{ nonce: string; expiresAt: string }>(res);
      if (!res.ok || !body.ok) {
        throw new Error(
          body.ok === false ? body.error.message ?? "Nonce request failed" : "Nonce request failed",
        );
      }
      return body.data;
    },
  });
}

/**
 * Verify EIP-191 signature after user signs the SIWE-style challenge (creates JWT + Postgres session).
 */
export function useWalletAuthVerifyMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["wallet-auth", "verify"],
    mutationFn: async (args: {
      message: string;
      signature: `0x${string}`;
      address: Address;
      chainId: number;
    }) => {
      const res = await fetch(verifyPath, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(args),
      });
      const body = await parseEnvelope<{ address: Address; chainId: number }>(res);
      if (!res.ok || !body.ok) {
        throw new Error(
          body.ok === false ? body.error.message ?? "Verification failed" : "Verification failed",
        );
      }
      await queryClient.invalidateQueries({ queryKey: walletSessionQueryKey });
      return body.data;
    },
  });
}

/** Revokes server-side session row + clears HTTP-only cookie. */
export function useWalletAuthSignOutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["wallet-auth", "sign-out"],
    mutationFn: async () => {
      const res = await fetch(sessionPath, { method: "DELETE", credentials: "include" });
      const body = await parseEnvelope<{ signedOut: boolean }>(res);
      if (!res.ok || !body.ok) {
        throw new Error(
          body.ok === false ? body.error.message ?? "Sign out failed" : "Sign out failed",
        );
      }
      await queryClient.invalidateQueries({ queryKey: walletSessionQueryKey });
      return body.data;
    },
  });
}
