/**
 * Socket.IO client URL — public env only.
 *
 * - `NEXT_PUBLIC_REALTIME_URL` — direct Railway realtime HTTPS origin
 * - `NEXT_PUBLIC_REALTIME_SAME_ORIGIN=true` + `REALTIME_UPSTREAM_URL` (server) —
 *   Next rewrites `/socket.io/*` to Railway; browser connects to the Vercel origin (no CORS).
 */

function trimEnv(name: string): string {
  return process.env[name]?.trim() ?? "";
}

export function isRealtimeSameOriginMode(): boolean {
  return trimEnv("NEXT_PUBLIC_REALTIME_SAME_ORIGIN") === "true";
}

/** Server-only upstream for `next.config` rewrites (no trailing slash). */
export function getRealtimeUpstreamUrl(): string {
  return trimEnv("REALTIME_UPSTREAM_URL").replace(/\/$/, "");
}

/**
 * Socket.IO server origin for the browser.
 * Pass `windowOrigin` when resolving on the client (e.g. `window.location.origin`).
 */
export function resolvePublicRealtimeUrl(windowOrigin?: string): string {
  const direct = trimEnv("NEXT_PUBLIC_REALTIME_URL").replace(/\/$/, "");
  if (direct) return direct;
  if (isRealtimeSameOriginMode() && windowOrigin) {
    return windowOrigin.replace(/\/$/, "");
  }
  return "";
}
