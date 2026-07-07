/** True when the app runs without Railway realtime/worker (Vercel-only stack). */
export function isVercelOnlyMode(): boolean {
  return process.env.NEXT_PUBLIC_ORAKLY_VERCEL_ONLY === "true";
}

/** HTTP poll interval for markets/activity when Socket.IO is unavailable. */
export const VERCEL_ONLY_MARKETS_POLL_MS = 45_000;
