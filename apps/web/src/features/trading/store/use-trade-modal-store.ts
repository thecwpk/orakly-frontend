"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { toast } from "sonner";
import { create } from "zustand";
import { invalidateMarketsFeed } from "@/shared/api/invalidate";
import { queryKeys } from "@/shared/api/query-keys";
import { resolveTradeModalMarket } from "../lib/resolve-trade-modal-market";

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

/** Opens trade modal — hydrates on-chain address from API when feed cache is stale. */
export function useOpenTradeModal() {
  const open = useTradeModalStore((s) => s.open);
  const qc = useQueryClient();

  return useCallback(
    (market: TradeModalMarket, initialOutcome: "YES" | "NO" = "YES") => {
      void (async () => {
        let resolved = market;
        if (!market.onChainAddress?.trim()) {
          const toastId = toast.loading("Loading on-chain market…");
          const hydrated = await resolveTradeModalMarket(market);
          toast.dismiss(toastId);
          if (hydrated) {
            resolved = hydrated;
            void qc.invalidateQueries({
              queryKey: queryKeys.markets.bySlug(market.slug),
            });
            invalidateMarketsFeed(qc);
          }
        }

        if (!resolved.onChainAddress?.trim()) {
          toast.error("Trading not available yet", {
            description:
              "This market has no on-chain contract linked. Deploy it from Admin → Markets, then try again.",
          });
          return;
        }

        if (resolved.status !== "OPEN") {
          toast.error("Market not open for trading", {
            description: `Status: ${resolved.status}`,
          });
          return;
        }

        open(resolved, initialOutcome);
      })();
    },
    [open, qc],
  );
}
