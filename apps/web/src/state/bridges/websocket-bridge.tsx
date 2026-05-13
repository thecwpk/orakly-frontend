"use client";

import { useEffect } from "react";
import { useSocketRegistry } from "@/websocket/socket-registry";
import { useWebsocketStore } from "../stores/websocket.store";

/**
 * Mirrors the SocketRegistry context's connection status into the global
 * websocket store. Lets components like the topbar status pill, mobile
 * "stale data" banner, and analytics dashboards subscribe to a single store
 * without each carrying their own context consumer.
 *
 * Mount once *inside* `SocketRegistryProvider` (which lives in `AppShell`).
 */
export function WebsocketBridge() {
  const { connectionStatus } = useSocketRegistry();

  useEffect(() => {
    const store = useWebsocketStore.getState();
    if (connectionStatus === "connected") {
      store.markConnected();
    } else if (connectionStatus === "error") {
      store.markDisconnected("connect_error");
    } else if (connectionStatus === "disconnected") {
      store.markDisconnected();
    } else {
      store.setStatus(connectionStatus);
    }
  }, [connectionStatus]);

  return null;
}
