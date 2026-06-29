"use client";

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

/** Stable hook for triggers — returns just `open` so callers don't subscribe to state. */
export function useOpenTradeModal() {
  return useTradeModalStore((s) => s.open);
}
