"use client";

import { useEffect } from "react";
import { fetchActivityFeed } from "@/shared/api/fetchers/activity-feed";
import { mergeFeedActivities } from "../store/feed-store";
import type { ConnectionStatus } from "../socket-registry";

const POLL_MS = 20_000;

/**
 * Hydrates the global activity tape from REST when Socket.IO is offline or unset.
 * Merges with any live WS rows already in the feed store.
 */
export function useActivityFeedHttpSync(connectionStatus: ConnectionStatus) {
  useEffect(() => {
    let cancelled = false;

    async function pull() {
      try {
        const rows = await fetchActivityFeed({ take: 120 });
        if (!cancelled && rows.length > 0) {
          mergeFeedActivities(rows);
        }
      } catch {
        // Tape stays empty until the next poll or WS reconnect.
      }
    }

    void pull();

    if (connectionStatus === "connected") {
      return () => {
        cancelled = true;
      };
    }

    const id = window.setInterval(() => void pull(), POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [connectionStatus]);
}
