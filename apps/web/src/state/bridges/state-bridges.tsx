"use client";

import { AuthBridge } from "./auth-bridge";
import { WebsocketBridge } from "./websocket-bridge";

/**
 * Mounts every state-sync bridge in one place. Mount this **inside** the
 * registry of the producers it consumes (`Web3AppProvider` for wagmi/SIWE,
 * `SocketRegistryProvider` for the realtime socket).
 *
 * The order doesn't matter — bridges are independent and idempotent.
 */
export function StateBridges() {
  return (
    <>
      <AuthBridge />
      <WebsocketBridge />
    </>
  );
}
