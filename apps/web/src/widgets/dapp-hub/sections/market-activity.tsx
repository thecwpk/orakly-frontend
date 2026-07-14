"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Calendar,
  Clock3,
  Plus,
  Star,
  ThumbsUp,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { LeaderboardAvatar } from "@/features/leaderboard/components/leaderboard-avatar";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/shared/constants/routes";
import { fetchMarketActivityFeed } from "@/shared/api/fetchers/activity-feed";
import { queryKeys } from "@/shared/api/query-keys";
import type { MarketActivityEvent } from "@/shared/contracts/market-activity";
import { feedPayloadToMarketActivity } from "@/shared/lib/market-activity-map";
import { useLiveActivityFeed } from "@/websocket/hooks/useLiveActivityFeed";
import { useSocketRegistry } from "@/websocket/socket-registry";
import { fmtUsdCompact } from "../lib/format-hub-metrics";

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

function IconCircle({
  className,
  children,
}: {
  className: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full ring-1",
        className,
      )}
    >
      {children}
    </span>
  );
}

function ActivityRow({
  event,
  flash,
}: {
  event: MarketActivityEvent;
  flash?: boolean;
}) {
  const marketHref = event.marketSlug
    ? ROUTES.market(event.marketSlug)
    : ROUTES.markets;

  return (
    <div
      className={cn(
        "flex gap-3 border-b border-[var(--hub-border)] py-3 transition last:border-b-0",
        "hover:bg-white/[0.03]",
        flash && "bg-amber-400/15",
      )}
    >
      {/* Icon */}
      {event.kind === "TRADE" && event.walletAddress ? (
        <LeaderboardAvatar
          address={event.walletAddress}
          className="size-9 rounded-full"
        />
      ) : event.kind === "MARKET_APPROVED" ? (
        <IconCircle className="bg-sky-500/15 ring-sky-400/30">
          <Star className="size-4 text-sky-300" />
        </IconCircle>
      ) : event.kind === "MARKET_CREATED" ? (
        <IconCircle className="bg-teal-500/15 ring-teal-400/30">
          <Plus className="size-4 text-teal-300" />
        </IconCircle>
      ) : event.kind === "MARKET_CLOSING" ? (
        <IconCircle className="bg-orange-500/15 ring-orange-400/30">
          <Clock3 className="size-4 text-orange-300" />
        </IconCircle>
      ) : event.kind === "COMMUNITY_VOTE" ? (
        <IconCircle className="bg-violet-500/15 ring-violet-400/30">
          <ThumbsUp className="size-4 text-violet-300" />
        </IconCircle>
      ) : (
        <IconCircle className="bg-amber-500/15 ring-amber-400/30">
          <Calendar className="size-4 text-amber-300" />
        </IconCircle>
      )}

      {/* Text */}
      <div className="min-w-0 flex-1">
        {event.kind === "TRADE" ? (
          <>
            <p className="text-[13px] leading-snug text-[var(--hub-fg)]">
              {event.walletAddress ? (
                <Link
                  href={ROUTES.traderProfile(event.walletAddress)}
                  className="font-medium text-[var(--hub-primary-bright)] hover:underline"
                >
                  {shortenAddress(event.walletAddress)}
                </Link>
              ) : (
                <span className="font-medium">Trader</span>
              )}{" "}
              bet{" "}
              <span
                className={cn(
                  "font-bold",
                  event.outcome === "NO" ? "text-rose-400" : "text-emerald-400",
                )}
              >
                {event.outcome ?? "YES"}
              </span>{" "}
              · {event.question}
            </p>
            <p className="mt-1 text-[11px] text-[var(--hub-muted)]">
              {event.amountBnb != null ? `${event.amountBnb} BNB` : "—"} ·{" "}
              {formatTimeAgo(event.at)}
            </p>
          </>
        ) : null}

        {event.kind === "MARKET_APPROVED" ? (
          <>
            <p className="text-[13px] leading-snug text-[var(--hub-fg)]">
              ✓ Market Approved — {event.question}
            </p>
            <p className="mt-1 text-[11px] text-[var(--hub-muted)]">
              Now open for trading · {formatTimeAgo(event.at)}
            </p>
          </>
        ) : null}

        {event.kind === "MARKET_CREATED" ? (
          <>
            <p className="text-[13px] leading-snug text-[var(--hub-fg)]">
              ✨ New Market — {event.question}
            </p>
            <p className="mt-1 text-[11px] text-[var(--hub-muted)]">
              {event.category ?? "Market"} · {formatTimeAgo(event.at)}
            </p>
          </>
        ) : null}

        {event.kind === "MARKET_CLOSING" ? (
          <>
            <p className="text-[13px] leading-snug text-[var(--hub-fg)]">
              ⏰ Closing Soon — {event.question}
            </p>
            <p className="mt-1 text-[11px] text-[var(--hub-muted)]">
              Closes in {event.hoursUntilClose ?? "?"} hour
              {(event.hoursUntilClose ?? 0) === 1 ? "" : "s"} ·{" "}
              {fmtUsdCompact(event.volumeUsd ?? 0)} volume
            </p>
          </>
        ) : null}

        {event.kind === "COMMUNITY_VOTE" ? (
          <>
            <p className="text-[13px] leading-snug text-[var(--hub-fg)]">
              Community voted on — {event.question}
            </p>
            <p className="mt-1 text-[11px] text-[var(--hub-muted)]">
              {event.voteCount ?? 0} total votes · {formatTimeAgo(event.at)}
            </p>
          </>
        ) : null}

        {event.kind === "UPCOMING_EVENT" ? (
          <>
            <p className="text-[13px] leading-snug text-[var(--hub-fg)]">
              📅 {event.eventName ?? event.question}
            </p>
            <p className="mt-1 text-[11px] text-[var(--hub-muted)]">
              {event.eventWhenLabel ?? "Soon"}
            </p>
          </>
        ) : null}
      </div>

      {/* Right action / badge */}
      <div className="shrink-0 self-center">
        {event.kind === "TRADE" ? (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-bold ring-1",
              event.outcome === "NO"
                ? "bg-rose-500/15 text-rose-300 ring-rose-400/30"
                : "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
            )}
          >
            {event.outcome ?? "YES"}
          </span>
        ) : null}

        {event.kind === "MARKET_APPROVED" || event.kind === "MARKET_CLOSING" ? (
          <Link
            href={marketHref}
            className="text-[12px] font-semibold text-[var(--hub-primary-bright)] hover:underline"
          >
            Trade →
          </Link>
        ) : null}

        {event.kind === "MARKET_CREATED" ? (
          <Link
            href={marketHref}
            className="text-[12px] font-semibold text-[var(--hub-primary-bright)] hover:underline"
          >
            View →
          </Link>
        ) : null}

        {event.kind === "COMMUNITY_VOTE" ? (
          <span className="text-[12px] font-semibold text-violet-300">
            {event.voteCount ?? 0} votes
          </span>
        ) : null}
      </div>
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
  const [flashId, setFlashId] = useState<string | null>(null);
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

    const newest = fresh[0]!;
    for (const e of fresh) seenIds.current.add(e.id);

    setItems((prev) => [...fresh, ...prev].slice(0, 10));
    setFlashId(newest.id);
    const t = window.setTimeout(() => setFlashId(null), 500);
    return () => window.clearTimeout(t);
  }, [liveFeed, socketConnected]);

  const rows = useMemo(() => items.slice(0, 10), [items]);

  return (
    <section className="hub-section" aria-label="Market Activity">
      <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-[20px] font-semibold tracking-tight text-[var(--hub-fg)]">
            Market Activity
          </h2>
          <p className="mt-1 text-[13px] text-[var(--hub-muted)]">
            Live feed of trades and events
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-emerald-400">
          <span className="relative flex size-2">
            <span className="absolute inset-0 animate-ping rounded-full bg-green-500/70" />
            <span className="relative size-2 animate-pulse rounded-full bg-green-500" />
          </span>
          Live
        </span>
      </div>

      <div className="rounded-2xl border border-[var(--hub-border)] bg-[var(--hub-card)] px-3 sm:px-4">
        {query.isLoading && rows.length === 0 ? (
          <div className="space-y-3 py-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="hub-skeleton h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <p className="px-2 py-10 text-center text-[14px] text-[var(--hub-muted)]">
            No activity yet. Be the first to trade! 🚀
          </p>
        ) : (
          <AnimatePresence initial={false}>
            {rows.map((event) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
              >
                <ActivityRow event={event} flash={flashId === event.id} />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </section>
  );
}
