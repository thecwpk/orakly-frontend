"use client";

import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { MARKET_CATEGORIES } from "@/features/markets/lib/categories";
import { useMarketsFilterStore } from "@/features/markets/store/use-markets-filter-store";
import { cn } from "@/lib/utils";

type Counts = Readonly<Record<string, number>>;

type Props = {
  /** Map of categorySlug -> match count given current search/trending filters. */
  counts: Counts;
  /** Total count for the "All" chip. */
  total: number;
};

const ALL = { slug: "all", name: "All", icon: Sparkles } as const;

export function MarketsCategoryRail({ counts, total }: Props) {
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
      {/* fade left */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute left-0 top-0 z-10 h-full w-10 bg-gradient-to-r from-[#06060a] to-transparent transition-opacity",
          edges.left ? "opacity-100" : "opacity-0",
        )}
      />
      {/* fade right */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute right-0 top-0 z-10 h-full w-10 bg-gradient-to-l from-[#06060a] to-transparent transition-opacity",
          edges.right ? "opacity-100" : "opacity-0",
        )}
      />

      {/* arrow controls */}
      {edges.left ? (
        <button
          type="button"
          aria-label="Scroll categories left"
          onClick={() => scrollBy(-220)}
          className="absolute left-1 top-1/2 z-20 hidden -translate-y-1/2 items-center justify-center rounded-full bg-black/60 p-1 text-zinc-300 ring-1 ring-white/10 backdrop-blur transition hover:bg-black/80 hover:text-white sm:inline-flex"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
      ) : null}
      {edges.right ? (
        <button
          type="button"
          aria-label="Scroll categories right"
          onClick={() => scrollBy(220)}
          className="absolute right-1 top-1/2 z-20 hidden -translate-y-1/2 items-center justify-center rounded-full bg-black/60 p-1 text-zinc-300 ring-1 ring-white/10 backdrop-blur transition hover:bg-black/80 hover:text-white sm:inline-flex"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      ) : null}

      <div
        ref={scrollerRef}
        role="tablist"
        aria-label="Filter markets by category"
        className={cn(
          "flex items-center gap-1 overflow-x-auto rounded-lg bg-black/25 p-1 ring-1 ring-white/[0.06]",
          "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
        )}
      >
        {[ALL, ...MARKET_CATEGORIES].map((cat) => {
          const isActive = active === cat.slug;
          const Icon = cat.icon;
          const count = cat.slug === "all" ? total : (counts[cat.slug] ?? 0);
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
                  ? "text-white"
                  : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100",
              )}
            >
              {isActive ? (
                <motion.span
                  layoutId="markets-category-pill"
                  className="absolute inset-0 rounded-lg bg-white/[0.08] ring-1 ring-cyan-400/30"
                  transition={{ type: "spring", stiffness: 420, damping: 32 }}
                />
              ) : null}
              <span className="relative flex items-center gap-1.5">
                <Icon
                  className={cn(
                    "h-3.5 w-3.5",
                    isActive ? "text-cyan-300" : "text-zinc-500",
                  )}
                />
                {cat.name}
                <span
                  className={cn(
                    "rounded-md px-1.5 py-px font-mono text-[10px] font-semibold tabular-nums leading-none",
                    isActive
                      ? "bg-cyan-500/15 text-cyan-200 ring-1 ring-cyan-400/25"
                      : "bg-white/[0.05] text-zinc-400 ring-1 ring-white/[0.06]",
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
