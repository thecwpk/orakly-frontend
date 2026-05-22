"use client";

import type { Market } from "@orakly/types";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useMarketsFeedQuery } from "@/shared/api/hooks/useMarketsFeedQuery";
import { ROUTES } from "@/shared/constants/routes";
import { useHydrationSafeReducedMotion } from "@/lib/use-hydration-safe-reduced-motion";
import { cn } from "@/lib/utils";
import { WatchlistStar } from "@/features/watchlist";
import { DenseMarketCard } from "../components/dense-market-card";
import { SectionShell } from "../components/section-shell";

const ACCENTS = ["cyan", "violet", "rose"] as const;
type Accent = (typeof ACCENTS)[number];

const AUTOPLAY_INTERVAL_MS = 4500;
const MAX_VISIBLE = 12;

function rankByVolume(markets: ReadonlyArray<Market>): Market[] {
  return [...markets]
    .sort((a, b) => (b.volumeUsd ?? 0) - (a.volumeUsd ?? 0))
    .slice(0, MAX_VISIBLE);
}

function CarouselSkeleton() {
  return (
    <div className="flex gap-3 overflow-hidden px-4 pb-2 sm:px-6">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "skeleton-shimmer h-[160px] shrink-0 rounded-xl bg-white/[0.03] ring-1 ring-white/[0.05]",
            "w-[78%] min-[480px]:w-[58%] sm:w-[44%] md:w-[34%] lg:w-[28%] xl:w-[24%]",
          )}
          style={{ animationDelay: `${i * 80}ms` }}
        />
      ))}
    </div>
  );
}

/**
 * Trending markets carousel — Polymarket-style, snap-x card track with
 * autoplay (paused on hover/focus + reduced-motion), drag/swipe, prev/next
 * arrows, and edge fades. Renders inside its own viewport so it can extend
 * beyond the page max-width on large screens.
 */
export function TrendingMarketsCarousel() {
  const { data, isLoading } = useMarketsFeedQuery();
  const reduceMotion = useHydrationSafeReducedMotion();

  const ranked = useMemo(() => rankByVolume(data ?? []), [data]);
  const trackRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [autoplay, setAutoplay] = useState(true);
  const [{ canPrev, canNext }, setEdges] = useState({
    canPrev: false,
    canNext: true,
  });

  const refreshEdges = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setEdges({
      canPrev: el.scrollLeft > 4,
      canNext: el.scrollLeft < max - 4,
    });
  }, []);

  useLayoutEffect(() => {
    refreshEdges();
  }, [refreshEdges, ranked.length]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener("scroll", refreshEdges, { passive: true });
    const ro = new ResizeObserver(refreshEdges);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", refreshEdges);
      ro.disconnect();
    };
  }, [refreshEdges]);

  const cardWidth = useCallback((): number => {
    const el = trackRef.current;
    if (!el) return 0;
    const card = el.querySelector<HTMLElement>("[data-carousel-card]");
    if (!card) return el.clientWidth * 0.7;
    const styles = window.getComputedStyle(el);
    const gap = parseFloat(styles.columnGap || styles.gap || "12") || 12;
    return card.offsetWidth + gap;
  }, []);

  const advance = useCallback(
    (dir: 1 | -1) => {
      const el = trackRef.current;
      if (!el) return;
      const w = cardWidth();
      const max = el.scrollWidth - el.clientWidth;
      const next = el.scrollLeft + dir * w;
      if (dir === 1 && el.scrollLeft >= max - 4) {
        el.scrollTo({ left: 0, behavior: reduceMotion ? "auto" : "smooth" });
        return;
      }
      if (dir === -1 && el.scrollLeft <= 4) {
        el.scrollTo({
          left: max,
          behavior: reduceMotion ? "auto" : "smooth",
        });
        return;
      }
      el.scrollTo({
        left: Math.max(0, Math.min(max, next)),
        behavior: reduceMotion ? "auto" : "smooth",
      });
    },
    [cardWidth, reduceMotion],
  );

  useEffect(() => {
    if (!autoplay || reduceMotion) return;
    if (hovered || focused) return;
    if (ranked.length < 2) return;
    const id = window.setInterval(() => advance(1), AUTOPLAY_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [advance, autoplay, focused, hovered, ranked.length, reduceMotion]);

  return (
    <SectionShell
      id="trending-markets"
      eyebrow="Live"
      title="Top volume"
      description="From the active feed — scroll or arrows."
      action={
        <div className="flex items-center gap-2">
          {!reduceMotion ? (
            <button
              type="button"
              onClick={() => setAutoplay((v) => !v)}
              aria-pressed={autoplay}
              aria-label={autoplay ? "Pause autoplay" : "Resume autoplay"}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-white/[0.04] text-zinc-400 ring-1 ring-white/[0.06] transition hover:bg-white/[0.08] hover:text-zinc-100"
            >
              {autoplay ? (
                <Pause className="h-3 w-3" />
              ) : (
                <Play className="h-3 w-3" />
              )}
            </button>
          ) : null}
        </div>
      }
    >
      <div
        className="relative"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocusCapture={() => setFocused(true)}
        onBlurCapture={() => setFocused(false)}
      >
        {/* edge fades hint at horizontal scroll */}
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-[#05050a] to-transparent transition-opacity",
            canPrev ? "opacity-100" : "opacity-0",
          )}
        />
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-[#05050a] to-transparent transition-opacity",
            canNext ? "opacity-100" : "opacity-0",
          )}
        />

        {isLoading ? (
          <CarouselSkeleton />
        ) : ranked.length === 0 ? (
          <div className="rounded-xl bg-white/[0.02] px-4 py-8 text-center text-[12.5px] text-zinc-500 ring-1 ring-white/[0.05]">
            No trending markets yet — check back soon.
          </div>
        ) : (
          <motion.div
            ref={trackRef}
            role="region"
            aria-label="Trending markets carousel"
            className={cn(
              "flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-2",
              "[scrollbar-width:none] [-ms-overflow-style:none]",
              "[&::-webkit-scrollbar]:hidden",
            )}
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            {ranked.map((market, idx) => (
              <div
                key={market.id}
                data-carousel-card
                className={cn(
                  "relative shrink-0 snap-start",
                  "w-[78%] min-[480px]:w-[58%] sm:w-[44%] md:w-[34%] lg:w-[28%] xl:w-[24%]",
                )}
              >
                <DenseMarketCard
                  market={market}
                  index={idx}
                  accent={ACCENTS[idx % ACCENTS.length] as Accent}
                  href={ROUTES.market(market.slug)}
                  openInNewTab
                />
                <div className="absolute right-2.5 top-2.5">
                  <WatchlistStar slug={market.slug} size="xs" />
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {ranked.length > 1 ? (
          <>
            <button
              type="button"
              onClick={() => advance(-1)}
              aria-label="Previous markets"
              className={cn(
                "absolute left-1.5 top-1/2 z-20 -translate-y-1/2",
                "inline-flex h-9 w-9 items-center justify-center rounded-full",
                "border border-white/[0.08] bg-[#0a0a10]/85 text-zinc-200 backdrop-blur-md",
                "shadow-[0_18px_40px_-18px_rgba(0,0,0,0.7)] transition",
                "hover:bg-[#0a0a10]/95 hover:border-white/[0.14]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/40",
              )}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => advance(1)}
              aria-label="Next markets"
              className={cn(
                "absolute right-1.5 top-1/2 z-20 -translate-y-1/2",
                "inline-flex h-9 w-9 items-center justify-center rounded-full",
                "border border-white/[0.08] bg-[#0a0a10]/85 text-zinc-200 backdrop-blur-md",
                "shadow-[0_18px_40px_-18px_rgba(0,0,0,0.7)] transition",
                "hover:bg-[#0a0a10]/95 hover:border-white/[0.14]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/40",
              )}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        ) : null}
      </div>
    </SectionShell>
  );
}
