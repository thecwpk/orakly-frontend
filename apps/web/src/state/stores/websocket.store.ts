"use client";

import { create } from "zustand";
import { devtools, subscribeWithSelector } from "zustand/middleware";
import { devtoolsConfig } from "../lib/devtools";

/**
 * UI-facing mirror of the realtime socket. The actual `Socket.IO` client lives
 * in `src/websocket/socket-registry.tsx`; this store is the *observable surface*
 * for components and bridges that want to react to connection lifecycle without
 * subscribing through React context.
 *
 * Why both? Because:
 *  - The registry owns side effects (subscribe/unsubscribe rooms) — it must
 *    stay tied to a React provider lifecycle.
 *  - The UI needs a globally-accessible "connection status pill", "stale data"
 *    badge, and "reconnect" CTA that should not require a context consumer.
 *
 * Never persisted. The bridge resets fields on every mount.
 */

export type ConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error";

export type WebsocketState = {
  status: ConnectionStatus;
  /** ms timestamp of last successful connect. */
  connectedAt: number | null;
  /** ms timestamp of last disconnect. */
  disconnectedAt: number | null;
  /** Last connect error message, if any. */
  lastError: string | null;
  /** Reconnect attempts since last successful connect. */
  reconnectAttempts: number;
  /** Estimated server clock skew (server - client) in ms. */
  serverSkewMs: number;
  /** Live count of currently subscribed market rooms (for stats overlays). */
  subscribedMarketCount: number;
  /** True iff a portfolio room is currently subscribed. */
  portfolioSubscribed: boolean;
};

export type WebsocketActions = {
  setStatus: (status: ConnectionStatus) => void;
  markConnected: () => void;
  markDisconnected: (err?: string | null) => void;
  setServerSkewMs: (ms: number) => void;
  setSubscribedMarketCount: (n: number) => void;
  setPortfolioSubscribed: (sub: boolean) => void;
  reset: () => void;
};

export type WebsocketStore = WebsocketState & WebsocketActions;

const INITIAL_STATE: WebsocketState = {
  status: "disconnected",
  connectedAt: null,
  disconnectedAt: null,
  lastError: null,
  reconnectAttempts: 0,
  serverSkewMs: 0,
  subscribedMarketCount: 0,
  portfolioSubscribed: false,
};

export const useWebsocketStore = create<WebsocketStore>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      ...INITIAL_STATE,

      setStatus: (status) => {
        const cur = get();
        if (cur.status === status) return;
        set({ status }, false, `ws/setStatus(${status})`);
      },

      markConnected: () =>
        set(
          {
            status: "connected",
            connectedAt: Date.now(),
            lastError: null,
            reconnectAttempts: 0,
          },
          false,
          "ws/markConnected",
        ),

      markDisconnected: (err) =>
        set(
          (s) => ({
            status: err ? "error" : "disconnected",
            disconnectedAt: Date.now(),
            lastError: err ?? null,
            reconnectAttempts:
              s.status === "connected" ? 0 : s.reconnectAttempts + 1,
          }),
          false,
          "ws/markDisconnected",
        ),

      setServerSkewMs: (ms) => set({ serverSkewMs: ms }, false, "ws/setServerSkewMs"),

      setSubscribedMarketCount: (n) =>
        set({ subscribedMarketCount: n }, false, "ws/setSubscribedMarketCount"),

      setPortfolioSubscribed: (sub) =>
        set({ portfolioSubscribed: sub }, false, "ws/setPortfolioSubscribed"),

      reset: () => set({ ...INITIAL_STATE }, false, "ws/reset"),
    })),
    devtoolsConfig("websocket"),
  ),
);

export function getWebsocketSnapshot(): Readonly<WebsocketState> {
  return useWebsocketStore.getState();
}
