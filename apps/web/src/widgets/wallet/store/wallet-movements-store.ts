"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type MovementKind = "DEPOSIT" | "WITHDRAW";

export type WalletMovement = {
  id: string;
  kind: MovementKind;
  /** USD amount, always positive — sign comes from `kind`. */
  amountUsd: number;
  status: "PENDING" | "CONFIRMED" | "FAILED";
  /** ISO timestamp when this row was created. */
  at: string;
  /** Optional address that initiated this movement (for display). */
  fromAddress?: string;
  /** Optional simulated tx hash. */
  hash?: string;
  /** Free-form note (e.g. wire reference, memo). */
  note?: string;
};

type State = {
  movements: WalletMovement[];
  add: (m: Omit<WalletMovement, "id" | "at"> & { id?: string; at?: string }) => string;
  patch: (id: string, patch: Partial<WalletMovement>) => void;
  clear: () => void;
};

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `mv_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
}

/**
 * Persisted local store for **demo** deposit/withdraw movements. Trades come
 * from the canonical `trades` API; movements live here so the UI can show a
 * unified transaction history without server changes.
 */
export const useWalletMovementsStore = create<State>()(
  persist(
    (set) => ({
      movements: [],
      add: ({ id, at, ...rest }) => {
        const movementId = id ?? newId();
        const now = at ?? new Date().toISOString();
        set((s) => ({
          movements: [
            { id: movementId, at: now, ...rest },
            ...s.movements,
          ].slice(0, 50),
        }));
        return movementId;
      },
      patch: (id, patch) =>
        set((s) => ({
          movements: s.movements.map((m) => (m.id === id ? { ...m, ...patch } : m)),
        })),
      clear: () => set({ movements: [] }),
    }),
    {
      name: "orakly:wallet-movements",
      version: 1,
      partialize: (s) => ({ movements: s.movements }),
    },
  ),
);
