"use client";

import { Activity, ArrowRightLeft, BarChart3, Gavel, TrendingUp, Waves } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNotificationsStore } from "@/features/notifications";
import { ActivityRow } from "@/features/realtime-activity";
import { buildActivityRows } from "@/features/realtime-activity/lib/build-rows";
import { probToCents } from "@/features/realtime-activity/lib/format";
import { timeAgo, useNowTick } from "@/features/realtime-activity/lib/time";
import type { ActivityRow as ActivityRowModel } from "@/features/realtime-activity/lib/types";
import {
  buildMarketsIndex,
  lookupMarket,
} from "@/features/realtime-activity/lib/types";
import { useMarketsFeedQuery } from "@/shared/api/hooks/useMarketsFeedQuery";
import { ROUTES } from "@/shared/constants/routes";
import { cn } from "@/lib/utils";
import type { Market } from "@orakly/types";
import { useLiveActivityFeed } from "@/websocket/hooks/useLiveActivityFeed";
import { useSocketRegistry } from "@/websocket/socket-registry";

const WHALE_NOTIONAL_USD = 3_500;
const FEED_CAP = 240;

const HUB_LANE =
  "hub-lane-panel flex min-h-0 flex-col overflow-hidden rounded-xl supports-[backdrop-filter]:backdrop-blur-sm";

const STATUS_FALLBACK = {
  dot: "bg-[var(--hub-muted)]",
  label: "Offline",
} as const;

const STATUS_TONE: Record<string, { dot: string; label: string }> = {
  connected: {
    dot: "bg-emerald-400 shadow-[0_0_10px_2px_rgba(16,185,129,0.45)]",
    label: "Live",
  },
  connecting: {
    dot: "bg-amber-400 shadow-[0_0_10px_2px_rgba(251,191,36,0.45)] animate-pulse",
    label: "Connecting",
  },
  disconnected: STATUS_FALLBACK,
  error: {
    dot: "bg-rose-400 shadow-[0_0_10px_2px_rgba(244,63,94,0.45)]",
    label: "Error",
  },
};

function yesEquivalentPx(trade: Extract<ActivityRowModel, { kind: "trade" }>): number {
  return trade.outcome === "YES" ? trade.price : 1 - trade.price;
}

function TapeLane({
  kicker,
  title,
  rows,
  emptyHint,
  icon: Icon,
  now,
  pulseTradeId,
  scrollClassName,
  primary,
}: {
  kicker: string;
  title: string;
  rows: ActivityRowModel[];
  emptyHint: string;
  icon: typeof Waves;
  now: number;
  pulseTradeId?: string | null;
  scrollClassName?: string;
  /** Wider header + subtle live chrome */
  primary?: boolean;
}) {
  return (
    <section
      className={cn(
        HUB_LANE,
        primary && "ring-[var(--hub-border-strong)]",
      )}
    >
      <div
        aria-hidden
        className={cn(
          "pointer-events-none h-px",
          primary
            ? "bg-gradient-to-r from-transparent via-[var(--hub-primary)]/35 to-transparent"
            : "bg-[var(--hub-border)]",
        )}
      />
      <header
        className={cn(
          "flex items-start gap-2 border-b border-[var(--hub-border)]",
          primary ? "px-3 py-2 sm:px-3.5" : "px-2.5 py-1.5",
        )}
      >
        <span
          className={cn(
            "mt-px inline-flex shrink-0 items-center justify-center rounded-md bg-[var(--hub-primary-soft)] text-[var(--hub-primary-bright)] ring-1 ring-[var(--hub-border)]",
            primary ? "h-8 w-8" : "h-6 w-6",
          )}
        >
          <Icon className={primary ? "h-4 w-4" : "h-3 w-3"} aria-hidden />
        </span>
        <div className="min-w-0 leading-tight">
          <p
            className={cn(
              "font-bold uppercase tracking-[0.18em] text-[var(--hub-muted)]",
              primary ? "text-[10px]" : "text-[9px]",
            )}
          >
            {kicker}
          </p>
          <p className={cn("font-semibold text-[var(--hub-fg)]", primary ? "text-sm" : "text-[12px]")}>
            {title}
          </p>
        </div>
      </header>
      <div
        className={cn(
          "min-h-[120px] flex-1 overflow-y-auto overscroll-contain",
          scrollClassName ??
            (primary ? "max-h-[min(62vh,580px)]" : "max-h-[min(30vh,280px)]"),
        )}
      >
        {rows.length === 0 ? (
          <p
            className={cn(
              "px-3 py-5 text-center leading-snug text-[var(--hub-muted)]",
              primary ? "text-[12px]" : "text-[11px]",
            )}
          >
            {emptyHint}
          </p>
        ) : (
          <div className="divide-y divide-[var(--hub-border)]">
            {rows.map((row) => (
              <ActivityRow
                key={row.id}
                row={row}
                now={now}
                compact
                dense
                fresh={row.kind === "trade" && Boolean(pulseTradeId && row.id === pulseTradeId)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function TrendingLane({
  items,
}: {
  items: ReadonlyArray<{ slug: string; title: string; count: number }>;
}) {
  return (
    <section className={HUB_LANE}>
      <div aria-hidden className="pointer-events-none h-px bg-[var(--hub-border)]" />
      <header className="flex items-start gap-2 border-b border-[var(--hub-border)] px-2.5 py-1.5">
        <span className="mt-px inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[var(--hub-primary-soft)] text-[var(--hub-primary-bright)] ring-1 ring-[var(--hub-border)]">
          <TrendingUp className="h-3 w-3" aria-hidden />
        </span>
        <div className="min-w-0 leading-tight">
          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--hub-muted)]">Heat</p>
          <p className="text-[12px] font-semibold text-[var(--hub-fg)]">Trending markets</p>
        </div>
      </header>
      <div className="max-h-[min(30vh,280px)] min-h-[80px] overflow-y-auto overscroll-contain">
        {items.length === 0 ? (
          <p className="px-3 py-4 text-center text-[11px] text-[var(--hub-muted)]">
            Flow will rank markets by recent fill count.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--hub-border)]">
            {items.map((it) => (
              <li key={it.slug}>
                <Link
                  href={ROUTES.market(it.slug)}
                  className="flex items-center gap-2 px-2.5 py-1 transition-colors hover:bg-[var(--hub-bg-subtle)]"
                >
                  <span className="min-w-0 flex-1 truncate text-[11px] font-medium leading-tight text-[var(--hub-fg)]">
                    {it.title}
                  </span>
                  <span className="shrink-0 rounded bg-[var(--hub-bg-subtle)] px-1 py-px font-mono text-[9px] tabular-nums text-[var(--hub-primary-bright)] ring-1 ring-[var(--hub-border)]">
                    {it.count} fills
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function MovementsLane({
  rows,
  now,
}: {
  rows: ReadonlyArray<{
    slug: string;
    title: string;
    at: number;
    deltaCents: number;
    tradeLabel: string;
    midLabel: string;
  }>;
  now: number;
}) {
  return (
    <section className={HUB_LANE}>
      <div aria-hidden className="pointer-events-none h-px bg-[var(--hub-bg-subtle)]" />
      <header className="flex items-start gap-2 border-b border-[var(--hub-border)] px-2.5 py-1.5">
        <span className="mt-px inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-amber-500/10 text-amber-200 ring-1 ring-amber-400/25">
          <BarChart3 className="h-3 w-3" aria-hidden />
        </span>
        <div className="min-w-0 leading-tight">
          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--hub-muted)]">Tape vs mid</p>
          <p className="text-[12px] font-semibold text-[var(--hub-fg)]">Market movers</p>
        </div>
      </header>
      <div className="max-h-[min(30vh,280px)] min-h-[80px] overflow-y-auto overscroll-contain">
        {rows.length === 0 ? (
          <p className="px-3 py-4 text-center text-[11px] text-[var(--hub-muted)]">
            Prints vs feed mid appear as trades cross active books.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--hub-border)]">
            {rows.map((r) => {
              const up = r.deltaCents > 0.05;
              const down = r.deltaCents < -0.05;
              const tone = up ? "text-emerald-300" : down ? "text-rose-300" : "text-[var(--hub-muted)]";
              const sign = r.deltaCents > 0 ? "+" : "";
              return (
                <li key={r.slug}>
                  <Link
                    href={ROUTES.market(r.slug)}
                    className="group flex items-center gap-2 px-2.5 py-1 transition-colors hover:bg-[var(--hub-bg-subtle)]"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-medium leading-tight text-[var(--hub-fg)] group-hover:text-[var(--hub-fg)]">
                        {r.title}
                      </p>
                      <p className="mt-0.5 font-mono text-[9px] tabular-nums text-[var(--hub-muted)]">
                        last {r.tradeLabel}
                        <span className="text-[var(--hub-border)]"> · </span>
                        mid {r.midLabel}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className={cn("font-mono text-[10px] font-semibold tabular-nums", tone)}>
                        {sign}
                        {r.deltaCents.toFixed(1)}¢
                      </p>
                      <p className="font-mono text-[9px] tabular-nums text-[var(--hub-muted)]">{timeAgo(r.at, now)}</p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

export function ActivityHubPage() {
  const liveFeed = useLiveActivityFeed();
  const notifications = useNotificationsStore((s) => s.notifications);
  const { data: markets } = useMarketsFeedQuery();
  const { connectionStatus } = useSocketRegistry();
  const now = useNowTick(10_000);

  const built = useMemo(
    () =>
      buildActivityRows({
        feed: liveFeed,
        notifications,
        markets,
        maxRows: FEED_CAP,
      }),
    [liveFeed, notifications, markets],
  );

  const tradesSorted = useMemo(
    () => [...built.trades].sort((a, b) => b.at - a.at),
    [built.trades],
  );

  const resolutionsSorted = useMemo(() => {
    return [...built.updates]
      .sort((a, b) => b.at - a.at)
      .filter(
        (u) =>
          u.variant === "MARKET_RESOLVED" ||
          /\bRESOLVED\b/i.test(u.variant) ||
          /\bRESOLVED\b/i.test(u.title),
      )
      .slice(0, 18);
  }, [built.updates]);

  const trendingMarkets = useMemo(() => {
    const counts = new Map<string, { title: string; slug: string; n: number; lastAt: number }>();
    for (const t of tradesSorted) {
      if (!t.market) continue;
      const slug = t.market.slug;
      const cur = counts.get(slug);
      if (cur) {
        cur.n += 1;
        cur.lastAt = Math.max(cur.lastAt, t.at);
      } else {
        counts.set(slug, { title: t.market.title, slug, n: 1, lastAt: t.at });
      }
    }
    return [...counts.values()]
      .sort((a, b) => b.n - a.n || b.lastAt - a.lastAt)
      .slice(0, 14)
      .map((x) => ({ slug: x.slug, title: x.title, count: x.n }));
  }, [tradesSorted]);

  const movementRows = useMemo(() => {
    const index = buildMarketsIndex(markets as readonly Market[] | undefined);
    const seen = new Set<string>();
    const out: Array<{
      slug: string;
      title: string;
      at: number;
      deltaCents: number;
      tradeLabel: string;
      midLabel: string;
    }> = [];

    for (const t of tradesSorted) {
      const slug = t.market?.slug;
      if (!slug || seen.has(slug)) continue;
      const m = lookupMarket(index, t.market?.id ?? null);
      if (!m) continue;
      seen.add(slug);
      const yesPx = yesEquivalentPx(t);
      const deltaCents = (yesPx - m.probability) * 100;
      out.push({
        slug,
        title: t.market?.title ?? m.title,
        at: t.at,
        deltaCents,
        tradeLabel: probToCents(yesPx),
        midLabel: probToCents(m.probability),
      });
      if (out.length >= 14) break;
    }
    return out;
  }, [markets, tradesSorted]);

  const whales = useMemo(
    () =>
      tradesSorted
        .filter((t) => Number.isFinite(t.notionalUsd) && t.notionalUsd >= WHALE_NOTIONAL_USD)
        .slice(0, 20),
    [tradesSorted],
  );

  const liveTape = useMemo(() => tradesSorted.slice(0, 42), [tradesSorted]);

  const headTradeId = liveTape[0]?.kind === "trade" ? liveTape[0].id : null;
  const skipMountPulseRef = useRef(true);
  const [pulseTradeId, setPulseTradeId] = useState<string | null>(null);

  useEffect(() => {
    if (!headTradeId) return;
    if (skipMountPulseRef.current) {
      skipMountPulseRef.current = false;
      return;
    }
    setPulseTradeId(headTradeId);
    const id = window.setTimeout(() => setPulseTradeId(null), 1_100);
    return () => window.clearTimeout(id);
  }, [headTradeId]);

  const status = STATUS_TONE[connectionStatus] ?? STATUS_FALLBACK;

  return (
    <main className="mx-auto max-w-[1400px] space-y-app-section pb-s48 pt-r24 sm:pb-s64 sm:pt-s40">
      <header className="flex flex-wrap items-center justify-between gap-r16">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--hub-bg-subtle)] px-2 py-0.5 ring-1 ring-[var(--hub-border)]">
              <span className={cn("h-1.5 w-1.5 rounded-full", status.dot)} />
              <span className="font-mono text-[10px] text-[var(--hub-muted)]">{status.label}</span>
            </span>
            <h1 className="text-lg font-semibold tracking-tight text-[var(--hub-fg)] sm:text-xl">Activity</h1>
          </div>
          <p className="mt-1 flex flex-wrap gap-x-2 gap-y-0 font-mono text-[10px] text-[var(--hub-muted)]">
            <span className="inline-flex items-center gap-1">
              <ArrowRightLeft className="h-3 w-3 text-[var(--hub-muted)]" aria-hidden />
              live tape
            </span>
            <span className="text-[var(--hub-border)]">·</span>
            <span>whales</span>
            <span className="text-[var(--hub-border)]">·</span>
            <span>flow heat</span>
            <span className="text-[var(--hub-border)]">·</span>
            <span>movers</span>
            <span className="text-[var(--hub-border)]">·</span>
            <span>settlements</span>
          </p>
        </div>
        <Link
          href={ROUTES.leaderboard}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[var(--hub-bg-subtle)] px-3 py-2 text-[12px] font-medium text-[var(--hub-fg)] ring-1 ring-[var(--hub-border)] transition hover:bg-[var(--hub-card-hover)]"
        >
          <Activity className="h-3.5 w-3.5" aria-hidden />
          Leaderboard
        </Link>
      </header>

      <div className="grid gap-r16 lg:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.82fr)] lg:gap-r24">
        <div className="min-h-0 space-y-r16">
          <TapeLane
            kicker="Execution"
            title="Live trades"
            rows={liveTape}
            emptyHint="Tape fills when connected markets print executions."
            icon={Activity}
            now={now}
            pulseTradeId={pulseTradeId}
            primary
          />
        </div>

        <div className="flex min-h-0 flex-col gap-r16">
          <TapeLane
            kicker="Size"
            title="Whale prints"
            rows={whales}
            emptyHint={`No fills ≥ ${WHALE_NOTIONAL_USD.toLocaleString()} USD in the current window.`}
            icon={Waves}
            now={now}
          />
          <TrendingLane items={trendingMarkets} />
          <MovementsLane rows={movementRows} now={now} />
          <TapeLane
            kicker="Settlement"
            title="Recent resolutions"
            rows={resolutionsSorted}
            emptyHint="Resolved markets surface here as MARKET_RESOLVED events arrive."
            icon={Gavel}
            now={now}
          />
        </div>
      </div>
    </main>
  );
}
