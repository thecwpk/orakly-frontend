import { useShallow } from "../lib/shallow";
import { useAuthStore, type AuthStore, type UserRole } from "../stores/auth.store";

/* ------------------------------------------------------------------ */
/*  Primitive selectors — return a single primitive for max stability  */
/* ------------------------------------------------------------------ */

export const useAuthAddress = () =>
  useAuthStore((s) => s.address);

export const useAuthChainId = () =>
  useAuthStore((s) => s.chainId);

export const useIsAuthenticated = () =>
  useAuthStore((s) => s.isAuthenticated);

export const useAuthRole = () =>
  useAuthStore((s) => s.role);

export const useTradingUserId = () =>
  useAuthStore((s) => s.tradingUserId);

/* ------------------------------------------------------------------ */
/*  Derived primitive selectors                                        */
/* ------------------------------------------------------------------ */

export const useIsWalletConnected = () =>
  useAuthStore((s) => s.address !== null);

export const useIsAdmin = () =>
  useAuthStore((s) => s.role === "ADMIN");

/** Platform ADMIN — sidebar Admin entry + operator chrome that must stay ADMIN-only. */
export const useIsPlatformAdmin = () =>
  useAuthStore((s) => s.role === "ADMIN");

export const useIsOperator = () =>
  useAuthStore((s) => s.role === "ADMIN" || s.role === "MODERATOR");

export const useHasRole = (role: UserRole) =>
  useAuthStore((s) => s.role === role);

/* ------------------------------------------------------------------ */
/*  Object selectors — wrapped in useShallow                           */
/* ------------------------------------------------------------------ */

export const useAuthIdentity = () =>
  useAuthStore(
    useShallow((s) => ({
      address: s.address,
      chainId: s.chainId,
      tradingUserId: s.tradingUserId,
      role: s.role,
    })),
  );

export const useAuthSession = () =>
  useAuthStore(
    useShallow((s) => ({
      isAuthenticated: s.isAuthenticated,
      authenticatedAt: s.authenticatedAt,
      address: s.address,
    })),
  );

/* ------------------------------------------------------------------ */
/*  Action selectors — actions are stable refs in Zustand              */
/* ------------------------------------------------------------------ */

export const useAuthActions = () =>
  useAuthStore(
    useShallow((s) => ({
      setWallet: s.setWallet,
      setSession: s.setSession,
      setTradingUserId: s.setTradingUserId,
      setRole: s.setRole,
      clearOperatorRole: s.clearOperatorRole,
      reset: s.reset,
    })),
  );

/* ------------------------------------------------------------------ */
/*  Selector primitives for use with `useAuthStore.subscribe(...)`     */
/* ------------------------------------------------------------------ */

export const selectAddress = (s: AuthStore) => s.address;
export const selectIsAuthenticated = (s: AuthStore) => s.isAuthenticated;
export const selectActor = (s: AuthStore) => s.tradingUserId ?? s.address;
