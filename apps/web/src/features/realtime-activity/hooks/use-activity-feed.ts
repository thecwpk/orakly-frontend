"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNotificationsStore } from "@/features/notifications";
import { useMarketsFeedQuery } from "@/shared/api/hooks";
import { useLiveActivityFeed } from "@/websocket/hooks/useLiveActivityFeed";
import { useSocketRegistry, type ConnectionStatus } from "@/websocket/socket-registry";
import { buildActivityRows, type BuildRowsResult } from "../lib/build-rows";
import type { ActivityFilter, ActivityRow } from "../lib/types";

export type UseActivityFeedOptions = {
  /** Filter rows to a single market — by slug, display id, or backend uuid. */
  marketScope?: string;
  /** Hard cap on rendered rows. */
  maxRows?: number;
  /** Initial filter tab. */
  defaultFilter?: ActivityFilter;
  /** When `true`, automatically pause appending new rows while the user is
   *  hovering or has scrolled the feed away from the top. New rows are still
   *  collected and surfaced via `pendingCount`. */
  pauseOnInteract?: boolean;
};

export type UseActivityFeedResult = {
  filter: ActivityFilter;
  setFilter: (f: ActivityFilter) => void;
  rows: ActivityRow[];
  /** Categorized counts for the tab badges. */
  counts: { all: number; trades: number; updates: number; yours: number };
  connection: ConnectionStatus;
  /** Number of new rows that arrived while the feed was paused. */
  pendingCount: number;
  /** Flush pending rows into the visible list. */
  resume: () => void;
  /** Imperative pause / set-paused. */
  pause: () => void;
  /** Bind these handlers to the scroll container to trigger pause-on-hover /
   *  pause-on-scroll. */
  scrollHandlers: {
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    onFocusCapture: () => void;
    onBlurCapture: () => void;
    onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  };
};

export function useActivityFeed(
  options: UseActivityFeedOptions = {},
): UseActivityFeedResult {
  const {
    marketScope,
    maxRows = 60,
    defaultFilter = "all",
    pauseOnInteract = true,
  } = options;

  const [filter, setFilter] = useState<ActivityFilter>(defaultFilter);
  const { connectionStatus } = useSocketRegistry();

  // ── Source streams
  const liveFeed = useLiveActivityFeed();
  const notifications = useNotificationsStore((s) => s.notifications);
  const marketsQuery = useMarketsFeedQuery();

  // ── Build once per source change. Heavy enough that we memoize the result.
  const built = useMemo<BuildRowsResult>(
    () =>
      buildActivityRows({
        feed: liveFeed,
        notifications,
        markets: marketsQuery.data,
        marketScope,
        maxRows,
      }),
    [liveFeed, notifications, marketsQuery.data, marketScope, maxRows],
  );

  // ── Pause-on-hover state.
  const [paused, setPaused] = useState(false);
  // Frozen view captured at the moment the user paused.
  const [frozenAll, setFrozenAll] = useState<ActivityRow[] | null>(null);
  const [frozenAt, setFrozenAt] = useState<number>(0);

  const pause = useCallback(() => {
    if (!pauseOnInteract) return;
    setPaused((prev) => {
      if (prev) return prev;
      setFrozenAll(built.all);
      setFrozenAt(Date.now());
      return true;
    });
  }, [pauseOnInteract, built.all]);

  const resume = useCallback(() => {
    setPaused(false);
    setFrozenAll(null);
    setFrozenAt(0);
  }, []);

  // Track whether the cursor is over the feed; if it leaves and the feed is
  // also scrolled to the top, auto-resume. We keep the latest scroll-top in a
  // ref to avoid re-renders.
  const hoveringRef = useRef(false);
  const scrollTopRef = useRef(0);

  const onMouseEnter = useCallback(() => {
    hoveringRef.current = true;
    pause();
  }, [pause]);

  const onMouseLeave = useCallback(() => {
    hoveringRef.current = false;
    if (scrollTopRef.current <= 4) resume();
  }, [resume]);

  const onScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const top = e.currentTarget.scrollTop;
      scrollTopRef.current = top;
      if (top > 4) {
        pause();
      } else if (!hoveringRef.current) {
        resume();
      }
    },
    [pause, resume],
  );

  // ── Compute the visible rows + pendingCount based on pause state.
  const visibleAll = paused && frozenAll ? frozenAll : built.all;
  const pendingCount = useMemo(() => {
    if (!paused) return 0;
    return built.all.filter((r) => r.at > frozenAt).length;
  }, [paused, built.all, frozenAt]);

  const rows = useMemo(() => {
    switch (filter) {
      case "trades":
        return paused
          ? built.trades.filter((r) => r.at <= frozenAt)
          : built.trades;
      case "updates":
        return paused
          ? built.updates.filter((r) => r.at <= frozenAt)
          : built.updates;
      case "yours":
        return paused
          ? built.yours.filter((r) => r.at <= frozenAt)
          : built.yours;
      default:
        return visibleAll;
    }
  }, [filter, built, visibleAll, paused, frozenAt]);

  // Reset pause whenever the filter changes — a fresh tab should start unpaused
  // so the user doesn't see a stale list under a tab they just clicked.
  useEffect(() => {
    resume();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  return {
    filter,
    setFilter,
    rows,
    counts: {
      all: built.all.length,
      trades: built.trades.length,
      updates: built.updates.length,
      yours: built.yours.length,
    },
    connection: connectionStatus,
    pendingCount,
    pause,
    resume,
    scrollHandlers: {
      onMouseEnter,
      onMouseLeave,
      onFocusCapture: onMouseEnter,
      onBlurCapture: onMouseLeave,
      onScroll,
    },
  };
}
