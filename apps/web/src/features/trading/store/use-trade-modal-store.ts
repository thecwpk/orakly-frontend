"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { create } from "zustand";

/** Minimal market shape the modal needs to open. */
export type TradeModalMarket = {
  /** Backend UUID for trading APIs / portfolio cache keys. */
  tradeMarketId: string | null;
  /** On-chain Market.sol clone — required for MetaMask execution. */
  onChainAddress: string | null;
  chainId: number | null;
  /** UI-friendly slug (used for routing/links). */
  slug: string;
  title: string;
  category: string;
  /** Mid YES probability (0..1). Used to seed the initial price quote. */
  midYes: number;
  /** Live ‘OPEN’ / ‘RESOLVED’ etc. */
  status: string;
  /** Resolution timestamp ISO. */
  closesAt: string;
};

type State = {
  isOpen: boolean;
  market: TradeModalMarket | null;
  initialOutcome: "YES" | "NO";

  open: (
    market: TradeModalMarket,
    initialOutcome?: "YES" | "NO",
  ) => void;
  close: () => void;
  setOpen: (next: boolean) => void;
};

export const useTradeModalStore = create<State>((set) => ({
  isOpen: false,
  market: null,
  initialOutcome: "YES",

  open: (market, initialOutcome = "YES") =>
    set({ isOpen: true, market, initialOutcome }),

  close: () => set({ isOpen: false }),

  setOpen: (next) =>
    set((s) => ({
      isOpen: next,
      market: next ? s.market : null,
    })),
}));

/** Stable hook for triggers — blocks markets that are not deployed on-chain. */
export function useOpenTradeModal() {
  const open = useTradeModalStore((s) => s.open);
  return useCallback(
    (market: TradeModalMarket, initialOutcome: "YES" | "NO" = "YES") => {
      if (!market.onChainAddress) {
        toast.error("Trading not available yet", {
          description:
            "This market is not deployed on-chain. An admin must deploy it from Admin → Markets first.",
        });
        return;
      }
      open(market, initialOutcome);
    },
    [open],
  );
}
