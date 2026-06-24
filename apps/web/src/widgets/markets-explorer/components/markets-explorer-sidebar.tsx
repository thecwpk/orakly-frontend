"use client";

import type { Market } from "@orakly/types";
import { formatCompactUsd } from "@orakly/utils";
import type { LucideIcon } from "lucide-react";
import { Activity, Flame, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { buildActivityRows } from "@/features/realtime-activity/lib/build-rows";
import type { TradeActivityRow } from "@/features/realtime-activity/lib/types";
import { useNotificationsStore } from "@/features/notifications";
import { ROUTES } from "@/shared/constants/routes";
import { cn } from "@/lib/utils";
import { useLiveActivityFeed } from "@/websocket/hooks/useLiveActivityFeed";

function SidebarPanel({
  title,
  icon: Icon,
  children,
  className,
}: {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-[var(--hub-border)] bg-[var(--hub-bg-subtle)]",
        className,
      )}
    >
      <div className="flex items-center gap-1.5 border-b border-[var(--hub-border)] px-2 py-1.5">
        <Icon className="h-3 w-3 shrink-0 text-[var(--hub-muted)]" aria-hidden />
        <span className="truncate text-[9px] font-semibold uppercase tracking-[0.14em] text-[var(--hub-muted)]">
          {title}
        </span>
      </div>
      <div className="max-h-[min(38vh,260px)] overflow-y-auto px-1.5 py-1.5">
        {children}
      </div>
    </div>
  );
}

export function MarketsExplorerSidebar({
  marketsIndex,
  narrativeHot,
  movers,
  className,
}: {
  marketsIndex: Market[] | undefined;
  narrativeHot: Market[];
  movers: Market[];
  className?: string;
}) {
  const tape = useLiveActivityFeed();
  const notifications = useNotificationsStore((s) => s.notifications);

  const { all } = useMemo(
    () =>
      buildActivityRows({
        feed: tape,
        notifications,
        markets: marketsIndex,
        maxRows: 72,
      }),
    [tape, notifications, marketsIndex],
  );

  const recentTrades = useMemo(() => {
    return all
      .filter((r): r is TradeActivityRow => r.kind === "trade")
      .slice(0, 14);
  }, [all]);

  return (
    <aside
      className={cn(
        "sticky top-[calc(var(--app-topbar-h)+10px)] hidden w-[286px] shrink-0 flex-col gap-2 xl:flex",
        className,
      )}
    >
      <SidebarPanel title="Live activity" icon={Activity}>
        {recentTrades.length === 0 ? (
          <p className="px-1 py-2 text-center text-[10px] text-[var(--hub-muted)]">
            Waiting for fills…
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {recentTrades.map((t) => {
              const title = t.market?.title ?? "Market";
              const short = title.length > 44 ? `${title.slice(0, 42)}…` : title;
              const yes = t.outcome === "YES";
              return (
                <li key={t.id}>
                  <div className="rounded-md px-1 py-0.5 hover:bg-[var(--hub-primary-soft)]/40">
                    <div className="flex items-start gap-1">
                      <span
                        className={cn(
                          "mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full",
                          yes ? "bg-[var(--hub-primary-bright)]" : "bg-[var(--hub-danger)]",
                        )}
                        aria-hidden
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-medium leading-snug text-[var(--hub-fg)]">
                          <span className={yes ? "text-[var(--hub-primary-bright)]" : "text-[var(--hub-danger)]"}>
                            {t.side === "SELL" ? "Sell " : "Buy "}
                            {t.outcome}
                          </span>
                          <span className="text-[var(--hub-muted)]"> · </span>
                          <span className="text-[var(--hub-muted)]">{short}</span>
                        </p>
                        <p className="mt-0.5 font-mono text-[9px] tabular-nums text-[var(--hub-muted)]">
                          {formatCompactUsd(t.notionalUsd)}
                        </p>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </SidebarPanel>

      <SidebarPanel title="Top movers" icon={TrendingUp}>
        {movers.length === 0 ? (
          <p className="px-1 py-2 text-center text-[10px] text-[var(--hub-muted)]">
            No markets in view.
          </p>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {movers.map((m) => {
              const p = Math.round((m.probability ?? 0.5) * 100);
              return (
                <li key={m.id}>
                  <Link
                    href={ROUTES.market(m.slug)}
                    prefetch
                    className="flex items-center gap-2 rounded-md px-1 py-1 transition hover:bg-[var(--hub-primary-soft)]/40"
                  >
                    <span className="min-w-0 flex-1 truncate text-[10.5px] font-medium leading-tight text-[var(--hub-fg)]">
                      {m.title}
                    </span>
                    <span className="shrink-0 font-mono text-[10px] tabular-nums text-[var(--hub-primary-bright)]">
                      {p}¢
                    </span>
                    <span className="shrink-0 font-mono text-[9px] tabular-nums text-[var(--hub-muted)]">
                      {formatCompactUsd(m.volumeUsd ?? 0)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </SidebarPanel>

      <SidebarPanel title="Trending narratives" icon={Flame}>
        {narrativeHot.length === 0 ? (
          <p className="px-1 py-2 text-center text-[10px] text-[var(--hub-muted)]">
            No volume leaders yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {narrativeHot.map((m) => (
              <li key={m.id}>
                <Link
                  href={ROUTES.market(m.slug)}
                  prefetch
                  className="block rounded-md px-1 py-1 transition hover:bg-[var(--hub-primary-soft)]/40"
                >
                  <p className="line-clamp-2 text-[10px] font-medium leading-snug text-[var(--hub-fg)]">
                    {m.title}
                  </p>
                  <div className="mt-0.5 flex items-center gap-2 font-mono text-[9px] tabular-nums text-[var(--hub-muted)]">
                    <span className="text-[var(--hub-primary-bright)]">
                      {Math.round((m.probability ?? 0.5) * 100)}¢
                    </span>
                    <span>{formatCompactUsd(m.volumeUsd ?? 0)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </SidebarPanel>
    </aside>
  );
}
