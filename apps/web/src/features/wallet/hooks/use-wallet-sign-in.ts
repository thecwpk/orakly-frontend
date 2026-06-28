"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";
import type { Address } from "viem";
import { UserRejectedRequestError } from "viem";
import { useAccount, useAccountEffect, useSignMessage, useSwitchChain } from "wagmi";
import { adminMeQueryKey } from "@/widgets/admin-dashboard/lib/admin-api";
import { tbnbChain } from "../config/chains";
import { performWalletSignIn } from "../lib/wallet-sign-in";
import { walletSessionQueryKey } from "./use-wallet-session-query";

/**
 * SIWE sign-in after wagmi connect — shared by auto-sign, gates, and retry buttons.
 */
export function useWalletSignIn() {
  const queryClient = useQueryClient();
  const { address, chainId, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { switchChainAsync } = useSwitchChain();
  const [isSigning, setIsSigning] = useState(false);
  const [userRejected, setUserRejected] = useState(false);
  const inFlightRef = useRef(false);

  useAccountEffect({
    onConnect() {
      setUserRejected(false);
    },
    onDisconnect() {
      setUserRejected(false);
    },
  });

  const signIn = useCallback(async (): Promise<boolean> => {
    if (!isConnected || !address || inFlightRef.current) return false;

    inFlightRef.current = true;
    setIsSigning(true);
    try {
      let activeChainId = chainId ?? null;
      if (activeChainId !== tbnbChain.id) {
        if (!switchChainAsync) return false;
        try {
          await switchChainAsync({ chainId: tbnbChain.id });
        } catch {
          return false;
        }
        activeChainId = tbnbChain.id;
      }

      const ok = await performWalletSignIn({
        address: address.toLowerCase() as Address,
        chainId: activeChainId,
        signMessage: signMessageAsync,
      });

      if (ok) {
        await queryClient.invalidateQueries({ queryKey: walletSessionQueryKey });
        await queryClient.invalidateQueries({ queryKey: adminMeQueryKey });
        setUserRejected(false);
      }
      return ok;
    } catch (error) {
      if (error instanceof UserRejectedRequestError) {
        setUserRejected(true);
      }
      return false;
    } finally {
      inFlightRef.current = false;
      setIsSigning(false);
    }
  }, [
    address,
    chainId,
    isConnected,
    queryClient,
    signMessageAsync,
    switchChainAsync,
  ]);

  const retrySignIn = useCallback(() => {
    setUserRejected(false);
    return signIn();
  }, [signIn]);

  return {
    signIn,
    retrySignIn,
    isSigning,
    userRejected,
  };
}
