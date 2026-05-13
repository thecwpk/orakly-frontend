"use client";

import { create } from "zustand";

type AppShellStore = {
  /** Mobile “More” sheet — utilities above the bottom dock. */
  mobileMoreMenuOpen: boolean;
  setMobileMoreMenuOpen: (next: boolean) => void;

  /** Wallet popover open state. NOT persisted. */
  walletOpen: boolean;
  setWalletOpen: (next: boolean) => void;

  /** Cmd-K palette open state — reserved for a future palette. NOT persisted. */
  paletteOpen: boolean;
  setPaletteOpen: (next: boolean) => void;
};

export const useAppShellStore = create<AppShellStore>()((set) => ({
  mobileMoreMenuOpen: false,
  setMobileMoreMenuOpen: (mobileMoreMenuOpen) => set({ mobileMoreMenuOpen }),

  walletOpen: false,
  setWalletOpen: (walletOpen) => set({ walletOpen }),

  paletteOpen: false,
  setPaletteOpen: (paletteOpen) => set({ paletteOpen }),
}));
