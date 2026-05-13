"use client";

import { useCallback } from "react";
import { useAccount, useSwitchChain } from "wagmi";
import { tbnbChain } from "../config/chains";

export function useRequireTbnb() {
  const { chainId, isConnected } = useAccount();
  const { switchChainAsync, isPending } = useSwitchChain();

  const ensureTbnb = useCallback(async () => {
    if (!isConnected) return { ok: false as const, reason: "disconnected" as const };
    if (chainId === tbnbChain.id) return { ok: true as const };
    if (!switchChainAsync) {
      return { ok: false as const, reason: "unsupported" as const };
    }
    try {
      await switchChainAsync({ chainId: tbnbChain.id });
      return { ok: true as const };
    } catch {
      return { ok: false as const, reason: "rejected" as const };
    }
  }, [chainId, isConnected, switchChainAsync]);

  return {
    chainId,
    isCorrectChain: chainId === tbnbChain.id,
    ensureTbnb,
    isSwitching: isPending,
    targetChain: tbnbChain,
  };
}
