"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";
import type { MouseEvent } from "react";
import { useWatchlistStore } from "../store/use-watchlist-store";
import { cn } from "@/lib/utils";

type Size = "xs" | "sm" | "md";

const SIZE_MAP: Record<Size, { btn: string; icon: string }> = {
  xs: { btn: "h-6 w-6", icon: "h-3 w-3" },
  sm: { btn: "h-7 w-7", icon: "h-3.5 w-3.5" },
  md: { btn: "h-8 w-8", icon: "h-4 w-4" },
};

/**
 * Toggle a market in/out of the user's watchlist. Drop into market cards,
 * the market details header, leaderboard rows, etc. Stops propagation so it
 * never accidentally navigates a wrapping `<Link>`.
 */
export function WatchlistStar({
  slug,
  size = "sm",
  className,
}: {
  slug: string;
  size?: Size;
  className?: string;
}) {
  const isStarred = useWatchlistStore((s) => s.slugs.includes(slug));
  const toggle = useWatchlistStore((s) => s.toggle);
  const sizing = SIZE_MAP[size];

  const onClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    toggle(slug);
  };

  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-pressed={isStarred}
      aria-label={isStarred ? "Remove from watchlist" : "Add to watchlist"}
      title={isStarred ? "In watchlist" : "Add to watchlist"}
      whileTap={{ scale: 0.85 }}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-md ring-1 transition",
        sizing.btn,
        isStarred
          ? "bg-amber-400/15 text-amber-300 ring-amber-300/30 hover:bg-amber-400/20"
          : "bg-white/[0.03] text-zinc-500 ring-white/[0.06] hover:bg-white/[0.07] hover:text-zinc-200",
        className,
      )}
    >
      <Star
        className={cn(sizing.icon, "transition-transform")}
        fill={isStarred ? "currentColor" : "none"}
        strokeWidth={isStarred ? 0 : 2}
      />
    </motion.button>
  );
}
