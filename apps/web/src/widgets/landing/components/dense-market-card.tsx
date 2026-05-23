"use client";

import type { Market } from "@orakly/types";
import { formatCompactUsd } from "@orakly/utils";
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function DenseMarketCard({
  market,
  accent = "cyan",
  index = 0,
  href,
  openInNewTab = false,
}: {
  market: Market;
  accent?: "cyan" | "violet" | "rose";
  index?: number;
  /** When set, the whole card navigates to this path (e.g. `/markets/${slug}`). */
  href?: string;
  /** Marketing-style surfaces: keep landing page while opening the destination in a new tab. */
  openInNewTab?: boolean;
}) {
  const pct = Math.round(market.probability * 100);
  const edge =
    accent === "violet" ? "neon-edge-violet"
    : accent === "rose" ? "neon-edge-rose"
    : "neon-edge-cyan";

  const card = (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.24) }}
      className={cn(
        "glass-panel-strong group relative overflow-hidden rounded-xl p-3.5 transition-colors hover:border-cyan-400/25",
        edge,
        href && "cursor-pointer",
      )}
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="flex gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-white/8 to-white/2 ring-1 ring-white/10">
          <TrendingUp className="h-5 w-5 text-cyan-400/90" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/6 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-400 ring-1 ring-white/10">
              {market.category}
            </span>
            <span className="text-[10px] text-zinc-600">{market.status}</span>
          </div>
          <h3 className="mt-1.5 line-clamp-2 text-sm font-medium leading-snug text-zinc-100">
            {market.title}
          </h3>
          <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-zinc-500">
            <span>
              Vol{" "}
              <span className="font-medium text-zinc-300">
                {formatCompactUsd(market.volumeUsd)}
              </span>
            </span>
            <span>
              Liq{" "}
              <span className="font-medium text-zinc-300">
                {formatCompactUsd(market.liquidityUsd)}
              </span>
            </span>
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-between text-[10px] text-zinc-500">
              <span>Odds</span>
              <span className="font-mono text-cyan-300/90">{pct}%</span>
            </div>
            <div className="mt-1 h-1 overflow-hidden rounded-full bg-zinc-800/80">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400"
                initial={{ width: 0 }}
                whileInView={{ width: `${pct}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
              />
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block min-w-0 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/40"
        {...(openInNewTab ? ({ target: "_blank", rel: "noopener noreferrer" } as const) : {})}
      >
        {card}
      </Link>
    );
  }

  return card;
}
