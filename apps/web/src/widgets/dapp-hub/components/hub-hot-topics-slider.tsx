"use client";

import { useMemo } from "react";
import { PrefetchLink } from "@/shared/ui";
import { ChevronRight, Flame } from "lucide-react";
import type { Market } from "@orakly/types";
import { cn } from "@/lib/utils";
import { ROUTES, marketsExplorerFeedUrl } from "@/shared/constants/routes";
import { useHydrationSafeReducedMotion } from "@/lib/use-hydration-safe-reduced-motion";

function fmtUsdToday(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "N/A";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M today`;
  if (n >= 10_000) return `$${(n / 1_000).toFixed(0)}k today`;
  return `$${Math.round(n).toLocaleString()} today`;
}

function pickHotRows(markets: readonly Market[], take: number): Market[] {
  return markets.slice(0, take);
}

function HotTopicSlideCard({ market: m }: { market: Market }) {
  const yes = Math.round((m.probability ?? 0.5) * 100);
  const no = 100 - yes;

  return (
    <PrefetchLink
      href={ROUTES.market(m.slug)}
      className={cn(
        "mb-hot-topic-slide group relative flex h-full min-h-[156px] w-[min(300px,78vw)] shrink-0 flex-col overflow-hidden rounded-xl border border-border/90",
        "bg-gradient-to-br from-card/85 via-card/60 to-primary/[0.05] p-3.5 shadow-sm ring-1 ring-border/40 transition",
        "hover:border-primary/30 hover:shadow-md hover:ring-primary/18",
      )}
    >
      <div className="flex min-h-0 flex-1 gap-2.5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-no/10 ring-1 ring-no/22">
          <Flame className="size-[18px] text-no/90" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-1 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {m.category}
          </p>
          <p className="mt-1 line-clamp-2 text-[13px] font-semibold leading-snug tracking-tight text-foreground group-hover:text-primary/95">
            {m.title}
          </p>
          <p className="mt-1.5 font-mono text-[10px] font-medium tabular-nums text-muted-foreground">{fmtUsdToday(m.volumeUsd)}</p>
        </div>
        <ChevronRight
          className="mt-0.5 size-4 shrink-0 self-start text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground"
          aria-hidden
        />
      </div>
      <div className="mt-3 space-y-1">
        <div
          className="flex h-1.5 overflow-hidden rounded-full bg-muted/90 ring-1 ring-border/40"
          title={`YES ${yes}% · NO ${no}%`}
        >
          <div className="bg-yes shadow-[0_0_12px_color-mix(in_srgb,var(--yes)_35%,transparent)]" style={{ width: `${yes}%` }} />
          <div className="min-w-0 flex-1 bg-no/25" />
        </div>
        <div className="flex items-center justify-between font-mono text-[10px] tabular-nums leading-none">
          <span className="font-semibold text-yes">YES {yes}%</span>
          <span className="text-no/90">NO {no}%</span>
        </div>
      </div>
    </PrefetchLink>
  );
}

const gutterX = "pl-[max(var(--app-page-gutter-x),env(safe-area-inset-left,0px))] pr-[max(var(--app-page-gutter-x),env(safe-area-inset-right,0px))]";

/**
 * Full-bleed horizontal hot topics — marquee when motion OK, otherwise scroll without autoplay.
 */
export function HubHotTopicsSlider({
  hotMarkets,
  loadingHot,
  hotTake = 8,
}: {
  hotMarkets: readonly Market[];
  loadingHot?: boolean;
  hotTake?: number;
}) {
  const reduceMotion = useHydrationSafeReducedMotion();
  const hotRows = useMemo(() => pickHotRows(hotMarkets, hotTake), [hotMarkets, hotTake]);

  const marqueeLoop = useMemo(() => {
    if (!hotRows.length || reduceMotion) return hotRows;
    return [...hotRows, ...hotRows];
  }, [hotRows, reduceMotion]);

  const runMarquee = !reduceMotion && hotRows.length > 0;

  return (
    <section className="mb-hot-topics-section border-t border-border/55 pb-6 pt-4 min-[1100px]:pb-7 min-[1100px]:pt-5" aria-labelledby="hub-hot-topics-heading">
      <div className={cn("mb-hot-topics-header-row mb-3 flex items-center justify-between gap-3", gutterX)}>
        <PrefetchLink
          href={marketsExplorerFeedUrl("cross_hot")}
          className="flex min-w-0 items-center gap-2.5 rounded-xl border border-transparent px-1 py-1 transition hover:border-border/80 hover:bg-muted/25"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-no/10 ring-1 ring-no/22">
            <Flame className="size-[18px] text-no/90" aria-hidden />
          </span>
          <span id="hub-hot-topics-heading" className="text-[14px] font-semibold leading-none tracking-tight text-foreground">
            Hot topics
          </span>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        </PrefetchLink>
      </div>

      <div className="relative overflow-hidden py-0.5">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 z-[2] w-10 bg-gradient-to-r from-background via-background/95 to-transparent sm:w-12"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 z-[2] w-10 bg-gradient-to-l from-background via-background/95 to-transparent sm:w-12"
        />

        {loadingHot && !hotRows.length ? (
          <div className={cn("flex gap-3", gutterX)}>
            {Array.from({ length: Math.min(6, hotTake) }).map((_, i) => (
              <div
                key={i}
                className="h-[168px] w-[min(300px,78vw)] shrink-0 animate-pulse rounded-xl bg-muted/40 ring-1 ring-border/30"
                aria-busy
              />
            ))}
          </div>
        ) : !hotRows.length ? (
          <p
            className={cn(
              "py-6 text-center font-mono text-[9.5px] leading-relaxed text-muted-foreground",
              gutterX,
            )}
          >
            Cross-lane topics appear when hub feeds overlap — syncing…
          </p>
        ) : runMarquee ? (
          <div className={cn("overflow-hidden", gutterX)}>
            <div
              className={cn("mb-hot-topics-marquee flex w-max gap-3", "nav-ticker-track")}
              role="list"
              aria-label="Hot topics from hub feeds (auto-scrolling)"
            >
              {marqueeLoop.map((m, i) => (
                <div key={`${m.id}-${i}`} role="listitem" className="h-full">
                  <HotTopicSlideCard market={m} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div
            className={cn(
              "flex gap-3 overflow-x-auto overscroll-x-contain pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
              gutterX,
            )}
            role="list"
            aria-label="Hot topics from hub feeds"
          >
            {hotRows.map((m) => (
              <div key={m.id} role="listitem" className="h-full">
                <HotTopicSlideCard market={m} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
