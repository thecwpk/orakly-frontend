"use client";

import { Activity } from "lucide-react";
import { PrefetchLink } from "@/shared/ui";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { useMarketsFeedScopedQuery } from "@/shared/api/hooks";
import { ROUTES } from "@/shared/constants/routes";
import { useLiveActivityFeed } from "@/websocket/hooks/useLiveActivityFeed";

/**
 * Thin live tape under the main navbar — Dexscreener / HL-style ambient flow.
 */
export function NavTrendingTicker({
  className,
  compact = false,
  mode = "activity",
}: {
  className?: string;
  /** Bloomberg-terminal density — hub layout */
  compact?: boolean;
  /** Hub mode shows market chips with yes/no real values. */
  mode?: "activity" | "markets";
}) {
  const tape = useLiveActivityFeed();
  const hubMarketsQ = useMarketsFeedScopedQuery({
    scope: "hub",
    lane: "trending",
    trendingBy: "volume",
    take: 10,
  });

  const marketRows = useMemo(() => {
    const rows = (hubMarketsQ.data ?? []).map((m) => {
      const yes = Math.round((m.probability ?? 0.5) * 100);
      const no = 100 - yes;
      const short = m.title.length > 36 ? `${m.title.slice(0, 34)}…` : m.title;
      return { key: m.id, slug: m.slug, title: short, yes, no };
    });
    if (!rows.length) {
      return [{ key: "idle-market", slug: "" as const, title: "No markets loaded", yes: 0, no: 0 }];
    }
    return rows;
  }, [hubMarketsQ.data]);

  const doubled = useMemo(() => {
    const slice = tape.slice(0, 32).map((r) => ({
      key: r.activityId,
      text: r.title ?? r.activityType,
    }));
    if (!slice.length) {
      const idle = { key: "idle", text: "Tape idle · executions stream when venues trade." };
      /** Duplicate so marquee animation runs instead of a single static chip */
      return [idle, idle];
    }
    return [...slice, ...slice];
  }, [tape]);
  const doubledMarkets = useMemo(() => [...marketRows, ...marketRows], [marketRows]);

  return (
    <div
      className={cn(
        "flex h-[var(--app-topbar-ticker-h)] items-center border-t border-app-subtle bg-app-ticker-band",
        compact ? "gap-2 px-3 sm:px-4 lg:px-5" : "gap-2.5 px-3 sm:px-4 lg:px-5",
        className,
      )}
      aria-label={mode === "markets" ? "Trending markets ticker" : "Live market activity"}
    >
      <span
        className={cn(
          "flex shrink-0 items-center rounded-sm font-mono font-semibold uppercase tracking-[0.12em] ring-1",
          mode === "markets"
            ? "border-transparent bg-yes/10 text-yes ring-yes/25"
            : "bg-emerald-500/10 text-emerald-400/90 ring-emerald-500/25",
          compact ? "gap-0.5 px-1.5 py-0.5 text-[7.5px]" : "gap-1 px-2 py-0.5 text-[8px]",
        )}
      >
        <Activity className={cn(mode === "markets" ? "text-yes" : "text-emerald-400/90", compact ? "h-1.5 w-1.5" : "h-2 w-2")} aria-hidden />
        {mode === "markets" ? "Markets" : "Live"}
      </span>
      <div className="relative min-w-0 flex-1 overflow-hidden">
        {mode === "markets" ? (
          <>
            <div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-6 bg-gradient-to-r from-background to-transparent sm:w-8"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 right-0 z-[1] w-8 bg-gradient-to-l from-background to-transparent sm:w-10"
            />
          </>
        ) : null}
        {mode === "markets" ? (
          <div
            className={cn(
              "flex w-max items-center whitespace-nowrap font-mono will-change-transform tabular-nums leading-none tracking-wide text-[10px]",
              compact ? "gap-x-5 text-[9px]" : "gap-x-7 text-[10px]",
              doubledMarkets.length > 1 ? "nav-ticker-track" : "",
            )}
          >
            {doubledMarkets.map((it, i) => (
              <span key={`${it.key}-${i}`} className="inline-flex shrink-0 items-center gap-x-2">
                <span className="select-none text-[color-mix(in_srgb,var(--foreground)_22%,transparent)]">|</span>
                {it.slug ? (
                  <PrefetchLink
                    href={ROUTES.market(it.slug)}
                    className={cn(
                      "truncate text-chrome-muted transition-colors hover:text-chrome",
                      compact ? "max-w-[min(42vw,200px)]" : "max-w-[min(38vw,260px)] md:max-w-[280px]",
                    )}
                  >
                    {it.title}
                  </PrefetchLink>
                ) : (
                  <span
                    className={cn(
                      "truncate text-chrome-muted",
                      compact ? "max-w-[min(42vw,200px)]" : "max-w-[min(38vw,260px)] md:max-w-[280px]",
                    )}
                  >
                    {it.title}
                  </span>
                )}
                <span className="text-yes">{it.yes}%</span>
                <span className="text-chrome-muted">/</span>
                <span className="text-rose-400/90">{it.no}%</span>
              </span>
            ))}
          </div>
        ) : (
          <div
            className={cn(
              "flex w-max whitespace-nowrap font-mono text-chrome-muted will-change-transform",
              compact ? "gap-6 text-[9px] leading-none" : "gap-10 text-[10px]",
              doubled.length > 1 ? "nav-ticker-track" : "",
            )}
          >
            {doubled.map((it, i) => (
              <span key={`${it.key}-${i}`} className={cn("inline-flex shrink-0 truncate", compact ? "max-w-[240px]" : "max-w-[280px]")}>
                <span className={cn("select-none text-emerald-500/55", compact ? "mr-1" : "mr-1.5")}>|</span>
                <span className="text-chrome-muted">{it.text}</span>
              </span>
            ))}
          </div>
        )}
      </div>
      {mode === "markets" ? (
        <PrefetchLink
          href={ROUTES.discover}
          className={cn(
            "shrink-0 whitespace-nowrap pl-1 font-mono text-[9px] font-medium uppercase tracking-[0.06em] text-yes/85 transition-colors hover:text-yes",
            compact ? "hidden sm:inline" : "",
          )}
        >
          View all →
        </PrefetchLink>
      ) : null}
    </div>
  );
}
