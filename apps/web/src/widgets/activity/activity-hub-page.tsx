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

const STATUS_FALLBACK = {
  dot: "bg-zinc-500",
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
        "flex min-h-0 flex-col overflow-hidden rounded-xl bg-[#07070f]/92 ring-1 ring-white/[0.07]",
        "supports-[backdrop-filter]:backdrop-blur-sm",
        primary &&
          "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] ring-emerald-400/15",
      )}
    >
      <div
        aria-hidden
        className={cn(
          "pointer-events-none h-px",
          primary ? "bg-gradient-to-r from-transparent via-emerald-400/35 to-transparent" : "bg-white/[0.06]",
        )}
      />
      <header
        className={cn(
          "flex items-start gap-2 border-b border-white/[0.06]",
          primary ? "px-3 py-2 sm:px-3.5" : "px-2.5 py-1.5",
        )}
      >
        <span
          className={cn(
            "mt-px inline-flex shrink-0 items-center justify-center rounded-md bg-cyan-500/10 text-cyan-300 ring-1 ring-cyan-400/25",
            primary ? "h-8 w-8" : "h-6 w-6",
          )}
        >
          <Icon className={primary ? "h-4 w-4" : "h-3 w-3"} aria-hidden />
        </span>
        <div className="min-w-0 leading-tight">
          <p
            className={cn(
              "font-bold uppercase tracking-[0.18em] text-zinc-500",
              primary ? "text-[10px]" : "text-[9px]",
            )}
          >
            {kicker}
          </p>
          <p className={cn("font-semibold text-white", primary ? "text-sm" : "text-[12px]")}>
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
              "px-3 py-5 text-center leading-snug text-zinc-500",
              primary ? "text-[12px]" : "text-[11px]",
            )}
          >
            {emptyHint}
          </p>
        ) : (
          <div className="divide-y divide-white/[0.045]">
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
    <section className="flex min-h-0 flex-col overflow-hidden rounded-xl bg-[#07070f]/92 ring-1 ring-white/[0.07] supports-[backdrop-filter]:backdrop-blur-sm">
      <div aria-hidden className="pointer-events-none h-px bg-white/[0.06]" />
      <header className="flex items-start gap-2 border-b border-white/[0.06] px-2.5 py-1.5">
        <span className="mt-px inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-violet-500/10 text-violet-200 ring-1 ring-violet-400/25">
          <TrendingUp className="h-3 w-3" aria-hidden />
        </span>
        <div className="min-w-0 leading-tight">
          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-500">Heat</p>
          <p className="text-[12px] font-semibold text-white">Trending markets</p>
        </div>
      </header>
      <div className="max-h-[min(30vh,280px)] min-h-[80px] overflow-y-auto overscroll-contain">
        {items.length === 0 ? (
          <p className="px-3 py-4 text-center text-[11px] text-zinc-500">
            Flow will rank markets by recent fill count.
          </p>
        ) : (
          <ul className="divide-y divide-white/[0.045]">
            {items.map((it) => (
              <li key={it.slug}>
                <Link
                  href={ROUTES.market(it.slug)}
                  className="flex items-center gap-2 px-2.5 py-1 transition-colors hover:bg-white/[0.04]"
                >
                  <span className="min-w-0 flex-1 truncate text-[11px] font-medium leading-tight text-zinc-100">
                    {it.title}
                  </span>
                  <span className="shrink-0 rounded bg-white/[0.06] px-1 py-px font-mono text-[9px] tabular-nums text-cyan-200 ring-1 ring-white/10">
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
    <section className="flex min-h-0 flex-col overflow-hidden rounded-xl bg-[#07070f]/92 ring-1 ring-white/[0.07] supports-[backdrop-filter]:backdrop-blur-sm">
      <div aria-hidden className="pointer-events-none h-px bg-white/[0.06]" />
      <header className="flex items-start gap-2 border-b border-white/[0.06] px-2.5 py-1.5">
        <span className="mt-px inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-amber-500/10 text-amber-200 ring-1 ring-amber-400/25">
          <BarChart3 className="h-3 w-3" aria-hidden />
        </span>
        <div className="min-w-0 leading-tight">
          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-500">Tape vs mid</p>
          <p className="text-[12px] font-semibold text-white">Market movers</p>
        </div>
      </header>
      <div className="max-h-[min(30vh,280px)] min-h-[80px] overflow-y-auto overscroll-contain">
        {rows.length === 0 ? (
          <p className="px-3 py-4 text-center text-[11px] text-zinc-500">
            Prints vs feed mid appear as trades cross active books.
          </p>
        ) : (
          <ul className="divide-y divide-white/[0.045]">
            {rows.map((r) => {
              const up = r.deltaCents > 0.05;
              const down = r.deltaCents < -0.05;
              const tone = up ? "text-emerald-300" : down ? "text-rose-300" : "text-zinc-400";
              const sign = r.deltaCents > 0 ? "+" : "";
              return (
                <li key={r.slug}>
                  <Link
                    href={ROUTES.market(r.slug)}
                    className="group flex items-center gap-2 px-2.5 py-1 transition-colors hover:bg-white/[0.04]"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-medium leading-tight text-zinc-100 group-hover:text-white">
                        {r.title}
                      </p>
                      <p className="mt-0.5 font-mono text-[9px] tabular-nums text-zinc-600">
                        last {r.tradeLabel}
                        <span className="text-zinc-700"> · </span>
                        mid {r.midLabel}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className={cn("font-mono text-[10px] font-semibold tabular-nums", tone)}>
                        {sign}
                        {r.deltaCents.toFixed(1)}¢
                      </p>
                      <p className="font-mono text-[9px] tabular-nums text-zinc-600">{timeAgo(r.at, now)}</p>
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
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.04] px-2 py-0.5 ring-1 ring-white/[0.08]">
              <span className={cn("h-1.5 w-1.5 rounded-full", status.dot)} />
              <span className="font-mono text-[10px] text-zinc-400">{status.label}</span>
            </span>
            <h1 className="text-lg font-semibold tracking-tight text-white sm:text-xl">Activity</h1>
          </div>
          <p className="mt-1 flex flex-wrap gap-x-2 gap-y-0 font-mono text-[10px] text-zinc-600">
            <span className="inline-flex items-center gap-1">
              <ArrowRightLeft className="h-3 w-3 text-zinc-500" aria-hidden />
              live tape
            </span>
            <span className="text-zinc-700">·</span>
            <span>whales</span>
            <span className="text-zinc-700">·</span>
            <span>flow heat</span>
            <span className="text-zinc-700">·</span>
            <span>movers</span>
            <span className="text-zinc-700">·</span>
            <span>settlements</span>
          </p>
        </div>
        <Link
          href={ROUTES.leaderboard}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-white/[0.05] px-3 py-2 text-[12px] font-medium text-zinc-200 ring-1 ring-white/10 transition hover:bg-white/[0.1]"
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
