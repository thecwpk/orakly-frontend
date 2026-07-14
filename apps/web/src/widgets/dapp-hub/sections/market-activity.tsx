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

function shortenAddress(addr: string): string {
  if (addr.length < 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function formatTimeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const s = Math.max(0, Math.floor(ms / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} minute${m === 1 ? "" : "s"} ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h === 1 ? "" : "s"} ago`;
  const d = Math.floor(h / 24);
  return `${d} day${d === 1 ? "" : "s"} ago`;
}

function truncateQuestion(q: string, max = 48): string {
  const t = q.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

/** First 6 hex digits of address → CSS hex color. */
function avatarColorFromAddress(addr: string): string {
  const cleaned = addr.replace(/^0x/i, "").replace(/[^0-9a-fA-F]/g, "");
  const hex = `${cleaned}000000`.slice(0, 6);
  return `#${hex}`;
}

function avatarInitials(addr: string): string {
  const cleaned = addr.replace(/^0x/i, "");
  return (cleaned.slice(0, 2) || "??").toUpperCase();
}

function WalletAvatar({ address }: { address: string }) {
  return (
    <span
      className="flex size-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
      style={{ backgroundColor: avatarColorFromAddress(address) }}
      aria-hidden
    >
      {avatarInitials(address)}
    </span>
  );
}

function EventAvatar({ event }: { event: MarketActivityEvent }) {
  if (event.kind === "TRADE" && event.walletAddress) {
    return <WalletAvatar address={event.walletAddress} />;
  }

  const tones: Record<string, string> = {
    MARKET_APPROVED: "bg-blue-600",
    MARKET_CREATED: "bg-teal-600",
    MARKET_CLOSING: "bg-amber-600",
    COMMUNITY_VOTE: "bg-violet-600",
    UPCOMING_EVENT: "bg-slate-600",
  };
  const glyphs: Record<string, string> = {
    MARKET_APPROVED: "✓",
    MARKET_CREATED: "✨",
    MARKET_CLOSING: "⏰",
    COMMUNITY_VOTE: "👍",
    UPCOMING_EVENT: "📅",
  };

  return (
    <span
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full text-sm text-white",
        tones[event.kind] ?? "bg-slate-600",
      )}
      aria-hidden
    >
      {glyphs[event.kind] ?? "•"}
    </span>
  );
}

function ActivityRow({
  event,
  isNew,
}: {
  event: MarketActivityEvent;
  isNew?: boolean;
}) {
  const marketHref = event.marketSlug
    ? ROUTES.market(event.marketSlug)
    : ROUTES.markets;
  const isYes = event.outcome !== "NO";
  const q = truncateQuestion(event.question);

  return (
    <div
      className={cn(
        "flex items-start gap-3 border-b border-white/[0.03] px-4 py-3 transition-colors last:border-b-0 hover:bg-white/[0.02]",
        isNew && "animate-slide-in animate-activity-flash",
      )}
    >
      <EventAvatar event={event} />

      <div className="min-w-0 flex-1">
        {event.kind === "TRADE" ? (
          <>
            <p className="text-sm text-slate-200">
              {event.walletAddress ? (
                <Link
                  href={ROUTES.traderProfile(event.walletAddress)}
                  className="font-mono text-xs text-slate-500 hover:text-slate-300"
                  onClick={(e) => e.stopPropagation()}
                >
                  {shortenAddress(event.walletAddress)}
                </Link>
              ) : (
                <span className="font-mono text-xs text-slate-500">Trader</span>
              )}
              {" bet "}
              <span
                className={cn(
                  "font-semibold",
                  isYes ? "text-green-400" : "text-red-400",
                )}
              >
                {event.outcome ?? "YES"}
              </span>
              {" · "}
              <span className="text-slate-400">{q}</span>
            </p>
            <p className="mt-0.5 text-xs text-slate-600">
              {event.amountBnb != null ? `${event.amountBnb} BNB` : "—"} ·{" "}
              {formatTimeAgo(event.at)}
            </p>
          </>
        ) : null}

        {event.kind === "MARKET_APPROVED" ? (
          <>
            <p className="text-sm text-slate-200">
              <span className="text-blue-400">✓ Approved</span>
              {" — "}
              {q}
            </p>
            <p className="mt-0.5 text-xs text-slate-600">{formatTimeAgo(event.at)}</p>
          </>
        ) : null}

        {event.kind === "MARKET_CREATED" ? (
          <>
            <p className="text-sm text-slate-200">
              <span className="text-teal-400">✨ New Market</span>
              {" — "}
              {q}
            </p>
            <p className="mt-0.5 text-xs text-slate-600">{formatTimeAgo(event.at)}</p>
          </>
        ) : null}

        {event.kind === "MARKET_CLOSING" ? (
          <>
            <p className="text-sm text-slate-200">
              <span className="text-amber-400">⏰ Closing Soon</span>
              {" — "}
              {q}
            </p>
            <p className="mt-0.5 text-xs text-slate-600">{formatTimeAgo(event.at)}</p>
          </>
        ) : null}

        {event.kind === "COMMUNITY_VOTE" ? (
          <>
            <p className="text-sm text-slate-200">
              <span className="text-violet-400">👍 Community Vote</span>
              {" — "}
              {q}
            </p>
            <p className="mt-0.5 text-xs text-slate-600">{formatTimeAgo(event.at)}</p>
          </>
        ) : null}

        {event.kind === "UPCOMING_EVENT" ? (
          <>
            <p className="text-sm text-slate-200">
              <span className="text-slate-400">📅 Upcoming</span>
              {" — "}
              {truncateQuestion(event.eventName ?? event.question)}
            </p>
            <p className="mt-0.5 text-xs text-slate-600">
              {event.eventWhenLabel ?? formatTimeAgo(event.at)}
            </p>
          </>
        ) : null}
      </div>

      <div className="shrink-0 self-center">
        {event.kind === "TRADE" ? (
          <span
            className={cn(
              "rounded border px-2 py-0.5 text-[10px] font-medium",
              isYes
                ? "border-green-500/20 bg-green-500/10 text-green-400"
                : "border-red-500/20 bg-red-500/10 text-red-400",
            )}
          >
            {event.outcome ?? "YES"}
          </span>
        ) : event.category ? (
          <span className="rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-slate-400">
            {event.category}
          </span>
        ) : (
          <Link
            href={marketHref}
            className="text-[10px] font-medium text-indigo-400 hover:text-indigo-300"
          >
            View →
          </Link>
        )}
      </div>
    </div>
  );
}

function ActivitySkeletonRows() {
  return (
    <div className="divide-y divide-white/[0.03]">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex animate-pulse items-start gap-3 px-4 py-3">
          <div className="size-9 shrink-0 rounded-full bg-white/10" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3.5 w-[85%] rounded bg-white/10" />
            <div className="h-2.5 w-28 rounded bg-white/5" />
          </div>
          <div className="mt-1 h-5 w-10 shrink-0 rounded bg-white/5" />
        </div>
      ))}
    </div>
  );
}

/**
 * Section 4 — Market Activity: live trades & platform events.
 */
export function MarketActivity() {
  const { connectionStatus } = useSocketRegistry();
  const socketConnected = connectionStatus === "connected";
  const liveFeed = useLiveActivityFeed();

  const query = useQuery({
    queryKey: [...queryKeys.activity.root(), "hub-market-activity", 10],
    queryFn: () => fetchMarketActivityFeed(10),
    staleTime: 5_000,
    refetchInterval: socketConnected ? false : 10_000,
  });

  const [items, setItems] = useState<MarketActivityEvent[]>([]);
  const [flashIds, setFlashIds] = useState<Set<string>>(new Set());
  const seenIds = useRef(new Set<string>());

  useEffect(() => {
    if (!query.data) return;
    setItems((prev) => {
      if (prev.length === 0) {
        for (const e of query.data) seenIds.current.add(e.id);
        return query.data.slice(0, 10);
      }
      const incoming = query.data.filter((e) => !seenIds.current.has(e.id));
      if (incoming.length === 0) return prev;
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
        }, 500);
      }
      return [...incoming, ...prev].slice(0, 10);
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

    setItems((prev) => [...fresh, ...prev].slice(0, 10));
    const newestId = fresh[0]!.id;
    setFlashIds((s) => new Set(s).add(newestId));
    const t = window.setTimeout(() => {
      setFlashIds((s) => {
        const next = new Set(s);
        next.delete(newestId);
        return next;
      });
    }, 500);
    return () => window.clearTimeout(t);
  }, [liveFeed, socketConnected]);

  const rows = useMemo(() => items.slice(0, 10), [items]);
  const loading = query.isLoading && rows.length === 0;

  return (
    <section className="hub-section" aria-label="Market Activity">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Market Activity</h2>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
          <span className="text-xs font-medium text-green-400">Live</span>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background-card)]">
        {loading ? (
          <ActivitySkeletonRows />
        ) : rows.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-slate-600">
            No activity yet. Be the first to trade! 🚀
          </p>
        ) : (
          rows.map((event) => (
            <ActivityRow
              key={event.id}
              event={event}
              isNew={flashIds.has(event.id)}
            />
          ))
        )}
      </div>
    </section>
  );
}
