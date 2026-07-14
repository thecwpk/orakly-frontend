"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";
import type { MouseEvent } from "react";
import { useWatchlist } from "../hooks/use-watchlist";
import { cn } from "@/lib/utils";

type Size = "xs" | "sm" | "md";

const SIZE_MAP: Record<Size, { btn: string; icon: string }> = {
  xs: { btn: "h-6 w-6", icon: "h-3 w-3" },
  sm: { btn: "h-7 w-7", icon: "h-3.5 w-3.5" },
  md: { btn: "h-8 w-8", icon: "h-4 w-4" },
};

/**
 * Toggle a market in/out of the user's watchlist (localStorage market IDs).
 * Stops propagation so wrapping card/link clicks are not triggered.
 */
export function WatchlistStar({
  id,
  /** @deprecated Prefer `id` — accepted only if `id` missing. */
  slug,
  size = "sm",
  className,
  absolute,
}: {
  id?: string;
  slug?: string;
  size?: Size;
  className?: string;
  /** Absolute top-right for card overlays. */
  absolute?: boolean;
}) {
  const marketId = (id ?? slug ?? "").trim();
  const { isWatchlisted, toggleWatchlist } = useWatchlist();
  const isStarred = marketId ? isWatchlisted(marketId) : false;
  const sizing = SIZE_MAP[size];

  const onClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    if (!marketId) return;
    toggleWatchlist(marketId);
  };

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={!marketId}
      aria-pressed={isStarred}
      aria-label={isStarred ? "Remove from watchlist" : "Save to watchlist"}
      title={isStarred ? "Remove from watchlist" : "Save to watchlist"}
      whileTap={{ scale: 0.85 }}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-md ring-1 transition",
        sizing.btn,
        absolute && "absolute right-2 top-2 z-20",
        isStarred
          ? "bg-amber-400/15 text-amber-300 ring-amber-300/30 hover:bg-amber-400/20"
          : "bg-black/40 text-zinc-400 ring-white/[0.08] backdrop-blur-sm hover:bg-black/55 hover:text-zinc-100",
        className,
      )}
    >
      <Star
        className={cn(sizing.icon, "transition-transform")}
        fill={isStarred ? "#facc15" : "none"}
        stroke={isStarred ? "#facc15" : "currentColor"}
        strokeWidth={isStarred ? 0 : 2}
      />
    </motion.button>
  );
}
