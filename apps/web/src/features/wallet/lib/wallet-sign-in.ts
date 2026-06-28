import type { Address } from "viem";
import { buildWalletAuthMessage } from "./auth-message";
import { tbnbChain } from "../config/chains";

type SignMessageFn = (args: { message: string }) => Promise<`0x${string}`>;

/**
 * Full SIWE handshake — used after wallet connect so "connect" == signed in.
 */
export async function performWalletSignIn(args: {
  address: Address;
  chainId?: number | null;
  signMessage: SignMessageFn;
}): Promise<boolean> {
  const chainId = args.chainId ?? tbnbChain.id;
  if (chainId !== tbnbChain.id) return false;

  const nonceRes = await fetch("/api/v1/wallet/auth/nonce", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address: args.address }),
  });
  const nonceJson = (await nonceRes.json()) as {
    ok?: boolean;
    data?: { nonce: string };
    error?: { message?: string };
  };
  if (!nonceRes.ok || !nonceJson.ok || !nonceJson.data?.nonce) {
    throw new Error(nonceJson.error?.message ?? "Could not issue nonce");
  }

  const host = typeof window !== "undefined" ? window.location.host : "localhost";
  const message = buildWalletAuthMessage({
    address: args.address,
    chainId,
    nonce: nonceJson.data.nonce,
    host,
  });

  const signature = await args.signMessage({ message });

  const verifyRes = await fetch("/api/v1/wallet/auth/verify", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      signature,
      address: args.address,
      chainId,
    }),
  });
  const verifyJson = (await verifyRes.json().catch(() => null)) as {
    ok?: boolean;
  } | null;
  return Boolean(verifyRes.ok && verifyJson?.ok);
}
