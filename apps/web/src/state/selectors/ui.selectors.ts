import { useShallow } from "../lib/shallow";
import {
  useUIStore,
  type LayoutDensity,
  type ReducedMotionOverride,
  type UIStore,
} from "../stores/ui.store";

/* Primitives */

export const useSidebarCollapsed = (): boolean =>
  useUIStore((s) => s.sidebarCollapsed);

export const useMobileDrawerOpen = (): boolean =>
  useUIStore((s) => s.mobileDrawerOpen);

export const usePaletteOpen = (): boolean =>
  useUIStore((s) => s.paletteOpen);

export const useNotificationsOpen = (): boolean =>
  useUIStore((s) => s.notificationsOpen);

export const useWalletPopoverOpen = (): boolean =>
  useUIStore((s) => s.walletPopoverOpen);

export const useDensity = (): LayoutDensity =>
  useUIStore((s) => s.density);

export const useReducedMotionPref = (): ReducedMotionOverride =>
  useUIStore((s) => s.reducedMotion);

export const useGlobalOverlay = (): boolean =>
  useUIStore((s) => s.globalOverlay);

/* Derived primitive */

export const useAnyOverlayOpen = (): boolean =>
  useUIStore(
    (s) =>
      s.mobileDrawerOpen ||
      s.paletteOpen ||
      s.notificationsOpen ||
      s.walletPopoverOpen ||
      s.globalOverlay,
  );

/* Object selectors */

export const useSidebarMeta = () =>
  useUIStore(
    useShallow((s) => ({
      collapsed: s.sidebarCollapsed,
      density: s.density,
    })),
  );

export const useUIPreferences = () =>
  useUIStore(
    useShallow((s) => ({
      sidebarCollapsed: s.sidebarCollapsed,
      density: s.density,
      reducedMotion: s.reducedMotion,
    })),
  );

/* Action selector */

export const useUIActions = () =>
  useUIStore(
    useShallow((s) => ({
      toggleSidebar: s.toggleSidebar,
      setSidebarCollapsed: s.setSidebarCollapsed,
      setDensity: s.setDensity,
      setReducedMotion: s.setReducedMotion,
      setMobileDrawerOpen: s.setMobileDrawerOpen,
      setPaletteOpen: s.setPaletteOpen,
      togglePalette: s.togglePalette,
      setNotificationsOpen: s.setNotificationsOpen,
      setWalletPopoverOpen: s.setWalletPopoverOpen,
      setGlobalOverlay: s.setGlobalOverlay,
      closeAllOverlays: s.closeAllOverlays,
    })),
  );

/* External `subscribe` selectors */

export const selectSidebarCollapsed = (s: UIStore) => s.sidebarCollapsed;
export const selectDensity = (s: UIStore) => s.density;
