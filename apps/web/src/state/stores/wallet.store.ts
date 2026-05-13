"use client";

import { create } from "zustand";
import { devtools, subscribeWithSelector } from "zustand/middleware";
import { devtoolsConfig } from "../lib/devtools";

/**
 * Canonical wallet *transaction* slice covering the on-chain interaction
 * lifecycle:
 *
 *   idle → preparing → pending_wallet → submitted → confirming → success | error
 *
 * Wallet **balances** themselves come from wagmi (`useBalance`) and the
 * portfolio query — those are server state and don't belong here.
 *
 * The legacy `useWalletUiStore` is wrapped/superseded by this slice. The
 * legacy `useWalletMovementsStore` (persisted demo deposits/withdraws) stays
 * as-is and is re-exported through `wallet.selectors` for a single import
 * surface.
 */

export type WalletTxPhase =
  | "idle"
  | "preparing"
  | "pending_wallet"
  | "submitted"
  | "confirming"
  | "success"
  | "error";

export type WalletTxKind = "DEPOSIT" | "WITHDRAW" | "TRADE" | "APPROVE" | "OTHER";

export type WalletState = {
  txPhase: WalletTxPhase;
  txKind: WalletTxKind | null;
  txHash: `0x${string}` | null;
  txError: string | null;
  /** USD amount being transferred (display-only). */
  txAmountUsd: number | null;
  /** Block confirmations seen so far (for `confirming` phase). */
  confirmations: number;
  /** Required confirmations before treating the tx as finalized. */
  requiredConfirmations: number;
  /** ms timestamp when the current tx left the `idle` state. */
  startedAt: number | null;
};

export type WalletActions = {
  beginTx: (input: {
    kind: WalletTxKind;
    amountUsd?: number | null;
    requiredConfirmations?: number;
  }) => void;
  setTxPhase: (phase: WalletTxPhase) => void;
  setTxHash: (hash: `0x${string}` | null) => void;
  setTxError: (message: string | null) => void;
  setConfirmations: (n: number) => void;
  finalizeTx: (success: boolean, error?: string | null) => void;
  resetTx: () => void;
};

export type WalletStore = WalletState & WalletActions;

const INITIAL_STATE: WalletState = {
  txPhase: "idle",
  txKind: null,
  txHash: null,
  txError: null,
  txAmountUsd: null,
  confirmations: 0,
  requiredConfirmations: 1,
  startedAt: null,
};

export const useWalletStore = create<WalletStore>()(
  devtools(
    subscribeWithSelector((set) => ({
      ...INITIAL_STATE,

      beginTx: ({ kind, amountUsd, requiredConfirmations }) =>
        set(
          {
            txPhase: "preparing",
            txKind: kind,
            txHash: null,
            txError: null,
            txAmountUsd: amountUsd ?? null,
            confirmations: 0,
            requiredConfirmations: requiredConfirmations ?? 1,
            startedAt: Date.now(),
          },
          false,
          `wallet/beginTx(${kind})`,
        ),

      setTxPhase: (txPhase) => set({ txPhase }, false, `wallet/setTxPhase(${txPhase})`),
      setTxHash: (txHash) => set({ txHash }, false, "wallet/setTxHash"),
      setTxError: (txError) => set({ txError }, false, "wallet/setTxError"),
      setConfirmations: (confirmations) =>
        set({ confirmations }, false, "wallet/setConfirmations"),

      finalizeTx: (success, error) =>
        set(
          {
            txPhase: success ? "success" : "error",
            txError: error ?? null,
          },
          false,
          `wallet/finalizeTx(${success ? "success" : "error"})`,
        ),

      resetTx: () => set({ ...INITIAL_STATE }, false, "wallet/resetTx"),
    })),
    devtoolsConfig("wallet"),
  ),
);

export function getWalletSnapshot(): Readonly<WalletState> {
  return useWalletStore.getState();
}
