"use client";

import { create } from "zustand";
import { devtools, persist, subscribeWithSelector } from "zustand/middleware";
import { devtoolsConfig } from "../lib/devtools";
import { createSafeJSONStorage, persistKey } from "../lib/ssr-storage";

/**
 * Aggregated UI store covering palette / overlays / density / motion prefs.
 * Trading chrome (mobile “More” sheet, etc.) lives on `useAppShellStore` in
 * `widgets/app-shell`.
 *
 * Why one big UI slice instead of many small ones? UI state is mostly read via
 * primitive selectors, so co-location avoids cross-store churn while keeping
 * theming + density in one place.
 */

export type LayoutDensity = "comfortable" | "compact";
export type ReducedMotionOverride = "system" | "always" | "never";

export type UIState = {
  /** Persisted: collapse the desktop sidebar to icon-rail. */
  sidebarCollapsed: boolean;
  /** Persisted: layout density across dense tables / cards. */
  density: LayoutDensity;
  /** Persisted: reduced-motion preference override. */
  reducedMotion: ReducedMotionOverride;

  /** Transient: mobile slide-in drawer is open. */
  mobileDrawerOpen: boolean;
  /** Transient: ⌘K palette is open. */
  paletteOpen: boolean;
  /** Transient: notifications popover is open. */
  notificationsOpen: boolean;
  /** Transient: wallet popover is open. */
  walletPopoverOpen: boolean;
  /** Transient: a generic loading overlay is up. */
  globalOverlay: boolean;
};

export type UIActions = {
  toggleSidebar: () => void;
  setSidebarCollapsed: (next: boolean) => void;
  setDensity: (density: LayoutDensity) => void;
  setReducedMotion: (mode: ReducedMotionOverride) => void;

  setMobileDrawerOpen: (next: boolean) => void;
  setPaletteOpen: (next: boolean) => void;
  togglePalette: () => void;
  setNotificationsOpen: (next: boolean) => void;
  setWalletPopoverOpen: (next: boolean) => void;
  setGlobalOverlay: (next: boolean) => void;

  /** Closes every transient overlay at once (route change, escape key…). */
  closeAllOverlays: () => void;
};

export type UIStore = UIState & UIActions;

const INITIAL_STATE: UIState = {
  sidebarCollapsed: false,
  density: "comfortable",
  reducedMotion: "system",

  mobileDrawerOpen: false,
  paletteOpen: false,
  notificationsOpen: false,
  walletPopoverOpen: false,
  globalOverlay: false,
};

export const useUIStore = create<UIStore>()(
  devtools(
    persist(
      subscribeWithSelector((set) => ({
        ...INITIAL_STATE,

        toggleSidebar: () =>
          set(
            (s) => ({ sidebarCollapsed: !s.sidebarCollapsed }),
            false,
            "ui/toggleSidebar",
          ),
        setSidebarCollapsed: (sidebarCollapsed) =>
          set({ sidebarCollapsed }, false, "ui/setSidebarCollapsed"),

        setDensity: (density) => set({ density }, false, "ui/setDensity"),
        setReducedMotion: (reducedMotion) =>
          set({ reducedMotion }, false, "ui/setReducedMotion"),

        setMobileDrawerOpen: (mobileDrawerOpen) =>
          set({ mobileDrawerOpen }, false, "ui/setMobileDrawerOpen"),

        setPaletteOpen: (paletteOpen) =>
          set({ paletteOpen }, false, "ui/setPaletteOpen"),
        togglePalette: () =>
          set((s) => ({ paletteOpen: !s.paletteOpen }), false, "ui/togglePalette"),

        setNotificationsOpen: (notificationsOpen) =>
          set({ notificationsOpen }, false, "ui/setNotificationsOpen"),

        setWalletPopoverOpen: (walletPopoverOpen) =>
          set({ walletPopoverOpen }, false, "ui/setWalletPopoverOpen"),

        setGlobalOverlay: (globalOverlay) =>
          set({ globalOverlay }, false, "ui/setGlobalOverlay"),

        closeAllOverlays: () =>
          set(
            {
              mobileDrawerOpen: false,
              paletteOpen: false,
              notificationsOpen: false,
              walletPopoverOpen: false,
              globalOverlay: false,
            },
            false,
            "ui/closeAllOverlays",
          ),
      })),
      {
        name: persistKey("ui"),
        version: 1,
        storage: createSafeJSONStorage(),
        // Persist user *preferences* only — overlays/transient flags reset on
        // every page load.
        partialize: (s) => ({
          sidebarCollapsed: s.sidebarCollapsed,
          density: s.density,
          reducedMotion: s.reducedMotion,
        }),
      },
    ),
    devtoolsConfig("ui"),
  ),
);

export function getUISnapshot(): Readonly<UIState> {
  return useUIStore.getState();
}
