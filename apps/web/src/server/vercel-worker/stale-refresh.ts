import { after } from "next/server";
import {
  recomputeLiveMarketProbabilities,
  recomputeTopActiveMarkets,
} from "@orakly/narratives";

let inFlight = false;

/**
 * Keeps OPEN market odds fresh on Vercel without Railway — runs after API responses.
 * Skips when a refresh is already in flight in this isolate.
 */
export function scheduleMarketsStaleRefresh(): void {
  if (process.env.ORAKLY_VERCEL_ONLY !== "true") return;
  if (inFlight) return;

  after(async () => {
    if (inFlight) return;
    inFlight = true;
    try {
      await Promise.allSettled([
        recomputeTopActiveMarkets(24),
        recomputeLiveMarketProbabilities(),
      ]);
    } catch (e) {
      console.warn("[vercel-worker] stale refresh failed", e);
    } finally {
      inFlight = false;
    }
  });
}
