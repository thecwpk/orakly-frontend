"use client";

import { useEffect } from "react";
import { useAccount } from "wagmi";
import { useWalletSignIn } from "../hooks/use-wallet-sign-in";
import { useWalletSessionQuery } from "../hooks/use-wallet-session-query";

/**
 * Connect wallet == sign in: after MetaMask connects, run SIWE immediately.
 */
export function WalletAutoSignIn() {
  const { address, isConnected } = useAccount();
  const { data: session, isPending: sessionPending } = useWalletSessionQuery();
  const { signIn, isSigning, userRejected } = useWalletSignIn();

  const sessionMatches = Boolean(
    session &&
      address &&
      session.address.toLowerCase() === address.toLowerCase(),
  );

  useEffect(() => {
    if (!isConnected || !address || sessionPending || sessionMatches) return;
    if (isSigning || userRejected) return;
    void signIn();
  }, [
    address,
    isConnected,
    isSigning,
    sessionMatches,
    sessionPending,
    signIn,
    userRejected,
  ]);

  return null;
}
