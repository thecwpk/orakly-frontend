"use client";

import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { MARKET_CATEGORIES } from "@/features/markets/lib/categories";
import { useMarketsFilterStore } from "@/features/markets/store/use-markets-filter-store";
import { cn } from "@/lib/utils";

type Counts = Readonly<Record<string, number>>;

type Props = {
  counts: Counts;
  total: number;
  isLoading?: boolean;
};

const ALL = { slug: "all", name: "All", icon: Sparkles } as const;

export function MarketsCategoryRail({ counts, total, isLoading }: Props) {
  const active = useMarketsFilterStore((s) => s.category);
  const setCategory = useMarketsFilterStore((s) => s.setCategory);

  const scrollerRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState<{ left: boolean; right: boolean }>({
    left: false,
    right: false,
  });

  const recalcEdges = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const left = el.scrollLeft > 4;
    const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 4;
    setEdges({ left, right });
  }, []);

  useEffect(() => {
    recalcEdges();
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener("scroll", recalcEdges, { passive: true });
    const ro = new ResizeObserver(recalcEdges);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", recalcEdges);
      ro.disconnect();
    };
  }, [recalcEdges]);

  const scrollBy = (dx: number) => {
    scrollerRef.current?.scrollBy({ left: dx, behavior: "smooth" });
  };

  return (
    <div className="relative">
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute left-0 top-0 z-10 h-full w-10 bg-gradient-to-r from-[var(--hub-chrome)] to-transparent transition-opacity",
          edges.left ? "opacity-100" : "opacity-0",
        )}
      />
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute right-0 top-0 z-10 h-full w-10 bg-gradient-to-l from-[var(--hub-chrome)] to-transparent transition-opacity",
          edges.right ? "opacity-100" : "opacity-0",
        )}
      />

      {edges.left ? (
        <button
          type="button"
          aria-label="Scroll categories left"
          onClick={() => scrollBy(-220)}
          className="absolute left-1 top-1/2 z-20 hidden -translate-y-1/2 items-center justify-center rounded-full bg-[var(--hub-card)] p-1 text-[var(--hub-muted)] ring-1 ring-[var(--hub-border)] backdrop-blur transition hover:text-[var(--hub-fg)] sm:inline-flex"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
      ) : null}
      {edges.right ? (
        <button
          type="button"
          aria-label="Scroll categories right"
          onClick={() => scrollBy(220)}
          className="absolute right-1 top-1/2 z-20 hidden -translate-y-1/2 items-center justify-center rounded-full bg-[var(--hub-card)] p-1 text-[var(--hub-muted)] ring-1 ring-[var(--hub-border)] backdrop-blur transition hover:text-[var(--hub-fg)] sm:inline-flex"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      ) : null}

      <div
        ref={scrollerRef}
        role="tablist"
        aria-label="Filter markets by category"
        className={cn(
          "flex items-center gap-1 overflow-x-auto rounded-lg bg-[var(--hub-bg-subtle)] p-1 ring-1 ring-[var(--hub-border)]",
          "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
        )}
      >
        {[ALL, ...MARKET_CATEGORIES].map((cat) => {
          const isActive = active === cat.slug;
          const Icon = cat.icon;
          const count = isLoading ? "N/A" : cat.slug === "all" ? total : (counts[cat.slug] ?? 0);
          return (
            <button
              key={cat.slug}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setCategory(cat.slug)}
              className={cn(
                "relative inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-md px-2 py-1 text-[11px] font-medium transition",
                isActive
                  ? "text-[var(--hub-fg)]"
                  : "text-[var(--hub-muted)] hover:bg-[var(--hub-primary-soft)]/50 hover:text-[var(--hub-fg)]",
              )}
            >
              {isActive ? (
                <motion.span
                  layoutId="markets-category-pill"
                  className="absolute inset-0 rounded-lg bg-[var(--hub-primary-soft)] ring-1 ring-[var(--hub-border-strong)]"
                  transition={{ type: "spring", stiffness: 420, damping: 32 }}
                />
              ) : null}
              <span className="relative flex items-center gap-1.5">
                <Icon
                  className={cn(
                    "h-3.5 w-3.5",
                    isActive ? "text-[var(--hub-primary-bright)]" : "text-[var(--hub-muted)]",
                  )}
                />
                {cat.name}
                <span
                  className={cn(
                    "rounded-md px-1.5 py-px font-mono text-[10px] font-semibold tabular-nums leading-none",
                    isActive
                      ? "bg-[var(--hub-primary)]/20 text-[var(--hub-primary-bright)] ring-1 ring-[var(--hub-border)]"
                      : "bg-[var(--hub-track-bg)] text-[var(--hub-muted)] ring-1 ring-[var(--hub-border)]",
                  )}
                >
                  {count}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
