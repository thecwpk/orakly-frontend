"use client";

import { useEffect, useRef } from "react";
import { useAccountEffect, useReconnect } from "wagmi";
import {
  readWalletPersistApproved,
  setWalletPersistApproved,
} from "./wallet-persist";

/**
 * Composes with `WagmiProvider reconnectOnMount={false}`:
 * - No eager reconnect on hydration (avoids auto-connect on cold load).
 * - After the user connects manually once, we persist approval and run a
 *   **single** `reconnectAsync` on the next mount so refresh restores the wallet.
 * - `useAccountEffect`: only non-reconnect connects flip the persist flag;
 *   disconnect clears it.
 */
export function WalletReconnectGate() {
  const { reconnectAsync } = useReconnect();
  const reconnectRan = useRef(false);

  useAccountEffect({
    onConnect({ isReconnected }) {
      if (!isReconnected) {
        setWalletPersistApproved(true);
      }
    },
    onDisconnect() {
      setWalletPersistApproved(false);
    },
  });

  useEffect(() => {
    if (!readWalletPersistApproved()) return;
    if (reconnectRan.current) return;
    reconnectRan.current = true;
    reconnectAsync().catch(() => {
      /* extension missing / user rejected — stay disconnected */
    });
  }, [reconnectAsync]);

  return null;
}
