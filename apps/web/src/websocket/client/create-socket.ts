"use client";

import { io, type Socket } from "socket.io-client";

export type MarketSocketOptions = {
  /** Full origin of the Socket.IO server (e.g. `http://localhost:3333`). Required — never defaults to the Next.js origin. */
  url: string;
  /** Socket.IO server path (default `/socket.io`). */
  path?: string;
  autoConnect?: boolean;
};

/**
 * Socket.IO client factory — call only when `NEXT_PUBLIC_REALTIME_URL` is set.
 * Next.js does not serve `/socket.io`; falling back to `window.location.origin` causes connect storms and "socket hangup".
 */
export function createMarketSocket(options: MarketSocketOptions): Socket {
  const url = options.url.trim();
  if (!url) {
    throw new Error("createMarketSocket: empty url");
  }

  const isProd = process.env.NODE_ENV === "production";

  return io(url, {
    path: options.path ?? "/socket.io",
    autoConnect: options.autoConnect ?? false,
    transports: ["websocket", "polling"],
    reconnectionAttempts: isProd ? 20 : Infinity,
    reconnectionDelay: 800,
    reconnectionDelayMax: 12_000,
    randomizationFactor: 0.5,
    timeout: 20_000,
  });
}
