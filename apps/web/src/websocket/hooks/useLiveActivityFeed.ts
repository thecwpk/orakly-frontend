"use client";

import { useSyncExternalStore } from "react";
import { EMPTY_FEED_SNAPSHOT, getFeedSnapshot, subscribeFeed } from "../store/feed-store";

/** Global cross-market activity — capped ring buffer, updates coalesce per WS message. */
export function useLiveActivityFeed() {
  return useSyncExternalStore(subscribeFeed, getFeedSnapshot, () => EMPTY_FEED_SNAPSHOT);
}
