"use client";

import { create } from "zustand";
import { devtools, subscribeWithSelector } from "zustand/middleware";
import type { Address } from "viem";
import { devtoolsConfig } from "../lib/devtools";

/**
 * AuthStore is the *single source of truth* for who's currently using the app:
 *
 *  - the connected EVM wallet (from wagmi),
 *  - whether they've completed the SIWE handshake (from `/wallet/auth/session`),
 *  - the platform user id used for trading API calls,
 *  - the operator role (USER / MODERATOR / ADMIN).
 *
 * It is **never persisted to localStorage** — wallet state is owned by wagmi
 * (cookies) and SIWE state is owned by the HttpOnly session cookie. Persisting
 * here would cause stale auth flashes on first paint.
 *
 * The `AuthBridge` component (mounted in `AppProviders`) is responsible for
 * keeping this slice in sync with wagmi + React Query state.
 */

export type UserRole = "USER" | "MODERATOR" | "ADMIN" | "GUEST";

export type AuthState = {
  /** Active wallet address (lowercased EIP-55), if connected. */
  address: Address | null;
  /** Active EVM chain id, if connected. */
  chainId: number | null;
  /** True after wallet has signed in via SIWE for this address. */
  isAuthenticated: boolean;
  /** Identifier used by trading APIs. May be a UUID, hex address, or undefined. */
  tradingUserId: string | null;
  /** Operator role. Only ADMIN/MODERATOR see the admin console. */
  role: UserRole;
  /** Last successful session timestamp (ms). */
  authenticatedAt: number | null;
  /** Last reset timestamp — useful to invalidate stale UI on logout. */
  resetAt: number;
};

export type AuthActions = {
  setWallet: (input: { address: Address | null; chainId: number | null }) => void;
  setSession: (input: {
    address: Address | null;
    chainId: number | null;
    isAuthenticated: boolean;
  }) => void;
  setTradingUserId: (id: string | null) => void;
  setRole: (role: UserRole) => void;
  /** Clear operator JWT role only (HttpOnly admin session absent). Wallet untouched. */
  clearOperatorRole: () => void;
  /** Hard reset (e.g. on disconnect or sign-out). */
  reset: () => void;
};

export type AuthStore = AuthState & AuthActions;

const INITIAL_STATE: AuthState = {
  address: null,
  chainId: null,
  isAuthenticated: false,
  tradingUserId: null,
  role: "GUEST",
  authenticatedAt: null,
  resetAt: Date.now(),
};

export const useAuthStore = create<AuthStore>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      ...INITIAL_STATE,

      setWallet: ({ address, chainId }) => {
        const cur = get();
        // Only commit on actual change to avoid re-render storms when wagmi
        // re-emits identical state.
        if (cur.address === address && cur.chainId === chainId) return;

        const addressChanged = cur.address !== address;
        set(
          {
            address,
            chainId,
            // Address change always invalidates the SIWE session — the bridge
            // re-hydrates `isAuthenticated` from the session query.
            ...(addressChanged
              ? { isAuthenticated: false, authenticatedAt: null }
              : {}),
          },
          false,
          "auth/setWallet",
        );
      },

      setSession: ({ address, chainId, isAuthenticated }) => {
        set(
          (s) => ({
            ...s,
            address: address ?? s.address,
            chainId: chainId ?? s.chainId,
            isAuthenticated,
            authenticatedAt:
              isAuthenticated && !s.authenticatedAt ? Date.now() : s.authenticatedAt,
          }),
          false,
          "auth/setSession",
        );
      },

      setTradingUserId: (tradingUserId) =>
        set({ tradingUserId }, false, "auth/setTradingUserId"),

      setRole: (role) => set({ role }, false, "auth/setRole"),

      clearOperatorRole: () => {
        const cur = get().role;
        if (cur !== "ADMIN" && cur !== "MODERATOR") return;
        set({ role: "GUEST" }, false, "auth/clearOperatorRole");
      },

      reset: () =>
        set(
          { ...INITIAL_STATE, resetAt: Date.now() },
          false,
          "auth/reset",
        ),
    })),
    devtoolsConfig("auth"),
  ),
);

/**
 * Imperative getter for non-component code (fetchers, server-event handlers)
 * that needs the current actor without subscribing.
 */
export function getAuthSnapshot(): Readonly<AuthState> {
  return useAuthStore.getState();
}
