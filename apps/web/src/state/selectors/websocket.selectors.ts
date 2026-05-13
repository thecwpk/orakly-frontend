import { useShallow } from "../lib/shallow";
import {
  useWebsocketStore,
  type ConnectionStatus,
  type WebsocketStore,
} from "../stores/websocket.store";

/* Primitive selectors */

export const useConnectionStatus = (): ConnectionStatus =>
  useWebsocketStore((s) => s.status);

export const useIsRealtimeConnected = (): boolean =>
  useWebsocketStore((s) => s.status === "connected");

export const useIsReconnecting = (): boolean =>
  useWebsocketStore(
    (s) => s.status === "connecting" && s.reconnectAttempts > 0,
  );

export const useReconnectAttempts = (): number =>
  useWebsocketStore((s) => s.reconnectAttempts);

export const useServerSkewMs = (): number =>
  useWebsocketStore((s) => s.serverSkewMs);

/* Derived primitives */

export const useIsRealtimeStale = (thresholdMs = 30_000): boolean =>
  useWebsocketStore((s) => {
    if (s.status === "connected") return false;
    if (!s.disconnectedAt) return false;
    return Date.now() - s.disconnectedAt > thresholdMs;
  });

/* Object selectors */

export const useConnectionMeta = () =>
  useWebsocketStore(
    useShallow((s) => ({
      status: s.status,
      connectedAt: s.connectedAt,
      disconnectedAt: s.disconnectedAt,
      lastError: s.lastError,
      reconnectAttempts: s.reconnectAttempts,
    })),
  );

export const useSubscriptionMeta = () =>
  useWebsocketStore(
    useShallow((s) => ({
      subscribedMarketCount: s.subscribedMarketCount,
      portfolioSubscribed: s.portfolioSubscribed,
    })),
  );

/* Action selector */

export const useWebsocketActions = () =>
  useWebsocketStore(
    useShallow((s) => ({
      setStatus: s.setStatus,
      markConnected: s.markConnected,
      markDisconnected: s.markDisconnected,
      setServerSkewMs: s.setServerSkewMs,
      setSubscribedMarketCount: s.setSubscribedMarketCount,
      setPortfolioSubscribed: s.setPortfolioSubscribed,
      reset: s.reset,
    })),
  );

/* Plain selectors for external `subscribe` callers */

export const selectWebsocketStatus = (s: WebsocketStore) => s.status;
export const selectIsRealtimeConnected = (s: WebsocketStore) =>
  s.status === "connected";
