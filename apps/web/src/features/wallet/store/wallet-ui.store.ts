import { create } from "zustand";

export type WalletTxPhase =
  | "idle"
  | "preparing"
  | "pending_wallet"
  | "submitted"
  | "confirming"
  | "success"
  | "error";

type WalletUiState = {
  txPhase: WalletTxPhase;
  txHash: `0x${string}` | null;
  txError: string | null;
  setTxPhase: (phase: WalletTxPhase) => void;
  setTxHash: (hash: `0x${string}` | null) => void;
  setTxError: (message: string | null) => void;
  resetTx: () => void;
};

export const useWalletUiStore = create<WalletUiState>((set) => ({
  txPhase: "idle",
  txHash: null,
  txError: null,
  setTxPhase: (txPhase) => set({ txPhase }),
  setTxHash: (txHash) => set({ txHash }),
  setTxError: (txError) => set({ txError }),
  resetTx: () =>
    set({
      txPhase: "idle",
      txHash: null,
      txError: null,
    }),
}));
