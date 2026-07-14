"use client";

import { create } from "zustand";

type GlobalSearchState = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
};

export const useGlobalSearchStore = create<GlobalSearchState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));
