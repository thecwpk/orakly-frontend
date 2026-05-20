"use client";

import type { FeedActivityPayload } from "@orakly/realtime-protocol";
import { useSyncExternalStore } from "react";
import {
  EMPTY_FEED_SNAPSHOT,
  getFeedGeneration,
  getFeedSnapshot,
  subscribeFeed,
} from "../store/feed-store";

/** Global cross-market activity — capped ring buffer, updates coalesce per WS message. */
export function useLiveActivityFeed(): readonly FeedActivityPayload[] {
  const gen = useSyncExternalStore(subscribeFeed, getFeedGeneration, () => 0);

  void gen;

  const rows = getFeedSnapshot();
  return rows.length === 0 ? EMPTY_FEED_SNAPSHOT : rows;
}
