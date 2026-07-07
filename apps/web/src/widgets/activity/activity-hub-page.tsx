"use client";

import {
  Activity,
  ArrowRightLeft,
  BarChart3,
  Coins,
  Gavel,
  TrendingUp,
  Trophy,
  Waves,
} from "lucide-react";
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
  "act-lane-panel flex min-h-0 flex-col overflow-hidden rounded-xl supports-[backdrop-filter]:backdrop-blur-sm";

function fmtUsdCompact(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "$0";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 10_000) return `$${(n / 1_000).toFixed(0)}K`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${Math.round(n).toLocaleString()}`;
}

function LaneHeader({
  kicker,
  title,
  icon: Icon,
  tone = "primary",
  count,
  primary,
  live,
}: {
  kicker: string;
  title: string;
  icon: typeof Waves;
  tone?: "primary" | "amber";
  count?: number;
  primary?: boolean;
  live?: boolean;
}) {
  const chip =
    tone === "amber"
      ? "bg-amber-500/10 text-amber-200 ring-amber-400/25"
      : "bg-[var(--hub-primary-soft)] text-[var(--hub-primary-bright)] ring-[var(--hub-border)]";
  return (
    <header
      className={cn(
        "flex items-center gap-2 border-b border-[var(--hub-border)]",
        primary ? "px-3 py-2.5 sm:px-4" : "px-2.5 py-2",
      )}
    >
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-lg ring-1",
          chip,
          primary ? "h-8 w-8" : "h-6 w-6",
        )}
      >
        <Icon className={primary ? "h-4 w-4" : "h-3 w-3"} aria-hidden />
      </span>
      <div className="min-w-0 leading-tight">
        <p
          className={cn(
            "font-bold uppercase tracking-[0.2em] text-[var(--hub-muted)]",
            primary ? "text-[10px]" : "text-[9px]",
          )}
        >
          {kicker}
        </p>
        <p className={cn("font-semibold text-[var(--hub-fg)]", primary ? "text-sm" : "text-[12px]")}>
          {title}
        </p>
      </div>
      <div className="ml-auto flex shrink-0 items-center gap-2">
        {live ? (
          <span className="inline-flex items-center gap-1.5">
            <span className="act-live-dot" aria-hidden />
            <span className="font-mono text-[9px] uppercase tracking-wider text-[var(--hub-muted)]">
              live
            </span>
          </span>
        ) : null}
        {typeof count === "number" && count > 0 ? (
          <span className="act-count-badge" aria-label={`${count} items`}>
            {count > 999 ? "999+" : count}
          </span>
        ) : null}
      </div>
    </header>
  );
}

function LaneEmpty({
  icon: Icon,
  hint,
  primary,
}: {
  icon: typeof Waves;
  hint: string;
  primary?: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2.5 px-4 py-8 text-center">
      <span className="act-empty-ring" aria-hidden>
        <Icon className="h-4 w-4" />
      </span>
      <p
        className={cn(
          "max-w-[24ch] leading-snug text-[var(--hub-muted)]",
          primary ? "text-[12px]" : "text-[11px]",
        )}
      >
        {hint}
      </p>
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Waves;
  label: string;
  value: string;
  accent?: "success" | "amber";
}) {
  const valueTone =
    accent === "success"
      ? "text-[var(--hub-success)]"
      : accent === "amber"
        ? "text-amber-200"
        : "text-[var(--hub-primary-bright)]";
  return (
    <div className="act-kpi flex items-center gap-3 px-3 py-2.5 sm:px-3.5 sm:py-3">
      <span
        className={cn(
          "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 ring-[var(--hub-border)]",
          accent === "amber"
            ? "bg-amber-500/10 text-amber-200"
            : accent === "success"
              ? "bg-[var(--hub-success-bg)] text-[var(--hub-success)]"
              : "bg-[var(--hub-primary-soft)] text-[var(--hub-primary-bright)]",
        )}
      >
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <div className="min-w-0 leading-tight">
        <p className={cn("font-mono text-[15px] font-bold tabular-nums sm:text-base", valueTone)}>
          {value}
        </p>
        <p className="mt-0.5 text-[9.5px] font-semibold uppercase tracking-[0.12em] text-[var(--hub-muted)]">
          {label}
        </p>
      </div>
    </div>
  );
}

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
    <section className={cn(HUB_LANE, primary && "act-lane-panel--primary")}>
      <LaneHeader
        kicker={kicker}
        title={title}
        icon={Icon}
        count={rows.length}
        primary={primary}
        live={primary}
      />
      <div
        className={cn(
          "act-lane-scroll min-h-[120px] flex-1 overflow-y-auto overscroll-contain",
          scrollClassName ??
            (primary ? "max-h-[min(62vh,580px)]" : "max-h-[min(30vh,280px)]"),
        )}
      >
        {rows.length === 0 ? (
          <LaneEmpty icon={Icon} hint={emptyHint} primary={primary} />
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
      <LaneHeader kicker="Heat" title="Trending markets" icon={TrendingUp} count={items.length} />
      <div className="act-lane-scroll max-h-[min(30vh,280px)] min-h-[80px] overflow-y-auto overscroll-contain">
        {items.length === 0 ? (
          <LaneEmpty icon={TrendingUp} hint="Flow will rank markets by recent fill count." />
        ) : (
          <ul className="divide-y divide-[var(--hub-border)]">
            {items.map((it, i) => (
              <li key={it.slug}>
                <Link
                  href={ROUTES.market(it.slug)}
                  className="group flex items-center gap-2.5 px-2.5 py-1.5 transition-colors hover:bg-[var(--hub-bg-subtle)]"
                >
                  <span className="w-4 shrink-0 text-center font-mono text-[10px] font-bold tabular-nums text-[var(--hub-muted)]">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[11px] font-medium leading-tight text-[var(--hub-fg)] group-hover:text-[var(--hub-primary-bright)]">
                    {it.title}
                  </span>
                  <span className="shrink-0 rounded-md bg-[var(--hub-primary-soft)] px-1.5 py-px font-mono text-[9px] font-semibold tabular-nums text-[var(--hub-primary-bright)] ring-1 ring-[var(--hub-border)]">
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
      <LaneHeader
        kicker="Tape vs mid"
        title="Market movers"
        icon={BarChart3}
        tone="amber"
        count={rows.length}
      />
      <div className="act-lane-scroll max-h-[min(30vh,280px)] min-h-[80px] overflow-y-auto overscroll-contain">
        {rows.length === 0 ? (
          <LaneEmpty icon={BarChart3} hint="Prints vs feed mid appear as trades cross active books." />
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

  const kpis = useMemo(() => {
    let volume = 0;
    const activeMarkets = new Set<string>();
    for (const t of tradesSorted) {
      if (Number.isFinite(t.notionalUsd)) volume += t.notionalUsd;
      if (t.market?.slug) activeMarkets.add(t.market.slug);
    }
    const fills = tradesSorted.length;
    return {
      volume,
      fills,
      whaleCount: whales.length,
      activeMarkets: activeMarkets.size,
      avgSize: fills > 0 ? volume / fills : 0,
    };
  }, [tradesSorted, whales.length]);

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

  const status = useMemo((): { dot: string; label: string } => {
    if (connectionStatus === "connected") {
      return STATUS_TONE.connected ?? STATUS_FALLBACK;
    }
    if (connectionStatus === "disconnected" && liveFeed.length > 0) {
      return {
        dot: "bg-sky-400 shadow-[0_0_10px_2px_rgba(56,189,248,0.45)]",
        label: "Updating",
      };
    }
    return STATUS_TONE[connectionStatus] ?? STATUS_FALLBACK;
  }, [connectionStatus, liveFeed.length]);

  return (
    <main className="mx-auto max-w-[1400px] space-y-r24 pb-s48 pt-r24 sm:pb-s64 sm:pt-s40">
      <header className="flex flex-wrap items-end justify-between gap-r16">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--hub-bg-subtle)] px-2.5 py-1 ring-1 ring-[var(--hub-border)]">
              <span className={cn("h-1.5 w-1.5 rounded-full", status.dot)} />
              <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-[var(--hub-muted)]">
                {status.label}
              </span>
            </span>
            <h1 className="act-title-gradient text-2xl font-bold tracking-tight sm:text-3xl">
              Activity
            </h1>
          </div>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0 font-mono text-[10px] text-[var(--hub-muted)]">
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
          className="group inline-flex shrink-0 items-center gap-2 rounded-lg bg-[var(--hub-primary)] px-3.5 py-2.5 text-[12px] font-semibold text-white shadow-[0_6px_18px_rgba(59,130,246,0.35)] ring-1 ring-white/10 transition hover:brightness-[1.06] active:scale-[0.98]"
        >
          <Trophy className="h-3.5 w-3.5" aria-hidden />
          Leaderboard
          <span className="text-white/70 transition group-hover:translate-x-0.5">→</span>
        </Link>
      </header>

      <section className="grid grid-cols-2 gap-r16 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard icon={Coins} label="24h Volume" value={fmtUsdCompact(kpis.volume)} />
        <KpiCard icon={Activity} label="Fills" value={kpis.fills.toLocaleString()} />
        <KpiCard icon={Waves} label="Whale prints" value={kpis.whaleCount.toLocaleString()} accent="amber" />
        <KpiCard icon={TrendingUp} label="Active markets" value={kpis.activeMarkets.toLocaleString()} />
        <KpiCard
          icon={BarChart3}
          label="Avg trade"
          value={fmtUsdCompact(kpis.avgSize)}
          accent="success"
        />
      </section>

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
