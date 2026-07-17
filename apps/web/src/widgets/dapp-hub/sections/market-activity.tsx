"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/shared/constants/routes";
import { fetchMarketActivityFeed } from "@/shared/api/fetchers/activity-feed";
import { queryKeys } from "@/shared/api/query-keys";
import type { MarketActivityEvent } from "@/shared/contracts/market-activity";
import { feedPayloadToMarketActivity } from "@/shared/lib/market-activity-map";
import { useLiveActivityFeed } from "@/websocket/hooks/useLiveActivityFeed";
import { useSocketRegistry } from "@/websocket/socket-registry";
import {
  ACTIVITY_FEED_PANELS,
  fillFeedPanel,
} from "../lib/market-activity-demo";

const POLL_MS = 10_000;
const PANEL_SIZE = 5;

function shortenAddress(addr: string): string {
  if (addr.length < 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function formatTimeAgo(iso: string): string {
  const target = new Date(iso).getTime();
  const ms = Date.now() - target;
  // Future timestamps (closing / events) → relative forward
  if (ms < -60_000) {
    const ahead = Math.abs(ms);
    const m = Math.floor(ahead / 60_000);
    if (m < 60) return `in ${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `in ${h}h`;
    const d = Math.floor(h / 24);
    return d === 1 ? "Tomorrow" : `in ${d}d`;
  }
  const s = Math.max(0, Math.floor(ms / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function truncate(q: string, max = 42): string {
  const t = q.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function formatUsdNotional(amount: number | null | undefined): string {
  const n = Number(amount);
  if (!Number.isFinite(n) || n <= 0) return "$0";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n).toLocaleString("en-US")}`;
  return `$${n.toFixed(0)}`;
}

function eventLine(event: MarketActivityEvent): string {
  const q = truncate(event.question);
  switch (event.kind) {
    case "TRADE": {
      const wallet = event.walletAddress
        ? shortenAddress(event.walletAddress)
        : "Trader";
      const side = event.outcome ?? "YES";
      const amt = formatUsdNotional(event.amountBnb);
      return `${wallet} bought ${amt} ${side} on ${q}`;
    }
    case "MARKET_APPROVED":
      return `Market Approved: ${q}`;
    case "MARKET_CREATED":
      return `New Market Submitted: ${q}`;
    case "MARKET_CLOSING": {
      const when =
        event.hoursUntilClose != null && event.hoursUntilClose <= 36
          ? event.hoursUntilClose <= 24
            ? "closes Tomorrow"
            : `closes in ${event.hoursUntilClose}h`
          : "closes soon";
      return `${q}: ${when}`;
    }
    case "UPCOMING_EVENT":
      return event.eventName?.trim() || q;
    case "COMMUNITY_VOTE": {
      const votes = event.voteCount != null ? ` (${event.voteCount} votes)` : "";
      return `${q}${votes}`;
    }
    default:
      return q;
  }
}

function FeedItem({
  event,
  isNew,
}: {
  event: MarketActivityEvent;
  isNew?: boolean;
}) {
  const href = event.marketSlug ? ROUTES.market(event.marketSlug) : null;
  const line = eventLine(event);
  const stamp =
    event.kind === "UPCOMING_EVENT" && event.eventWhenLabel
      ? event.eventWhenLabel
      : formatTimeAgo(event.at);

  const body = (
    <div
      className={cn(
        "hub-dapp-feed-row",
        isNew && "hub-dapp-feed-row--new",
      )}
    >
      <p className="hub-dapp-feed-line">{line}</p>
      <p className="hub-dapp-feed-time">{stamp}</p>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="hub-dapp-feed-row--link">
        {body}
      </Link>
    );
  }
  return body;
}

function FeedPanel({
  title,
  accent,
  items,
  flashIds,
  loading,
}: {
  title: string;
  accent: string;
  items: MarketActivityEvent[];
  flashIds: Set<string>;
  loading: boolean;
}) {
  return (
    <div className="hub-dapp-feed-panel">
      <div className="hub-dapp-feed-panel-head">
        <h3 className={cn("hub-dapp-feed-panel-title", accent)}>{title}</h3>
        <span className="hub-dapp-feed-panel-count">{items.length}</span>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="hub-dapp-skel h-3.5 w-[94%]" />
                <div className="hub-dapp-skel h-3 w-[72%]" />
                <div className="hub-dapp-skel h-2 w-12" />
              </div>
            ))}
          </div>
        ) : (
          items.map((event) => (
            <FeedItem
              key={event.id}
              event={event}
              isNew={flashIds.has(event.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

/**
 * Section 4 — Market Activity: six labeled mini-feeds (not one merged stream).
 */
export function MarketActivity() {
  const { connectionStatus } = useSocketRegistry();
  const socketConnected = connectionStatus === "connected";
  const liveFeed = useLiveActivityFeed();

  const query = useQuery({
    queryKey: [...queryKeys.activity.root(), "hub-market-activity-panels", 40],
    queryFn: () => fetchMarketActivityFeed(40),
    staleTime: 4_000,
    refetchInterval: POLL_MS,
    retry: 1,
  });

  const [items, setItems] = useState<MarketActivityEvent[]>([]);
  const [flashIds, setFlashIds] = useState<Set<string>>(new Set());
  const [tick, setTick] = useState(0);
  const seenIds = useRef(new Set<string>());

  // Keep relative stamps fresh
  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 30_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!query.data) return;
    setItems((prev) => {
      if (prev.length === 0) {
        for (const e of query.data) seenIds.current.add(e.id);
        return query.data;
      }
      const incoming = query.data.filter((e) => !seenIds.current.has(e.id));
      if (incoming.length === 0) {
        // Refresh in-place (updated payloads / order)
        const byId = new Map(prev.map((e) => [e.id, e]));
        for (const e of query.data) byId.set(e.id, e);
        return [...byId.values()].sort(
          (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
        );
      }
      for (const e of incoming) seenIds.current.add(e.id);
      const newestId = incoming[0]?.id;
      if (newestId) {
        setFlashIds((s) => new Set(s).add(newestId));
        window.setTimeout(() => {
          setFlashIds((s) => {
            const next = new Set(s);
            next.delete(newestId);
            return next;
          });
        }, 800);
      }
      return [...incoming, ...prev].slice(0, 80);
    });
  }, [query.data]);

  useEffect(() => {
    if (!socketConnected || liveFeed.length === 0) return;
    const mapped = liveFeed
      .map(feedPayloadToMarketActivity)
      .filter((e): e is MarketActivityEvent => Boolean(e));
    const fresh = mapped.filter((e) => !seenIds.current.has(e.id));
    if (fresh.length === 0) return;
    for (const e of fresh) seenIds.current.add(e.id);
    setItems((prev) => [...fresh, ...prev].slice(0, 80));
    const newestId = fresh[0]!.id;
    setFlashIds((s) => new Set(s).add(newestId));
    const t = window.setTimeout(() => {
      setFlashIds((s) => {
        const next = new Set(s);
        next.delete(newestId);
        return next;
      });
    }, 800);
    return () => window.clearTimeout(t);
  }, [liveFeed, socketConnected]);

  const panels = useMemo(() => {
    void tick;
    return ACTIVITY_FEED_PANELS.map((panel) => {
      const filled = fillFeedPanel(panel.kind, items, PANEL_SIZE);
      return { ...panel, ...filled };
    });
  }, [items, tick]);

  const loading = query.isLoading && items.length === 0;

  return (
    <section className="hub-section" aria-label="Market Activity">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold text-white">Market Activity</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Live panels for trades, listings, closings, events, and votes.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-400">
            <span
              className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-green-500"
              aria-hidden
            />
            {socketConnected ? "Live updates" : "Updating"}
          </span>
        </div>
      </div>

      <div className="hub-dapp-grid-activity">
        {panels.map((panel) => (
          <FeedPanel
            key={panel.id}
            title={panel.title}
            accent={panel.accent}
            items={panel.items}
            flashIds={flashIds}
            loading={loading}
          />
        ))}
      </div>
    </section>
  );
}
