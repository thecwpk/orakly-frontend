"use client";

import { useEffect } from "react";
import { fetchActivityFeed } from "@/shared/api/fetchers/activity-feed";
import { mergeFeedActivities } from "../store/feed-store";
import type { ConnectionStatus } from "../socket-registry";

const POLL_MS_LIVE = 8_000;
const POLL_MS_REST = 12_000;

/**
 * Hydrates the global activity tape from REST.
 * In Vercel-only mode this is the primary feed path (no Socket.IO).
 */
export function useActivityFeedHttpSync(connectionStatus: ConnectionStatus) {
  useEffect(() => {
    let cancelled = false;
    const pollMs =
      connectionStatus === "connected" ? POLL_MS_LIVE : POLL_MS_REST;

    async function pull() {
      try {
        const rows = await fetchActivityFeed({ take: 120 });
        if (!cancelled && rows.length > 0) {
          mergeFeedActivities(rows);
        }
      } catch {
        // Tape stays empty until the next poll.
      }
    }

    void pull();

    const id = window.setInterval(() => void pull(), pollMs);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [connectionStatus]);
}
