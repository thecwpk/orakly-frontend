"use client";

import { motion } from "framer-motion";
import { Briefcase, ChevronRight, Layers } from "lucide-react";
import Link from "next/link";
import { memo, useMemo } from "react";
import { ROUTES } from "@/shared/constants/routes";
import { cn } from "@/lib/utils";
import { compactUsd } from "../lib/format";
import type { CategoryMix, PositionExposure } from "../lib/types";

const CATEGORY_TONE: Record<string, string> = {
  Crypto: "from-cyan-400 to-emerald-400",
  Macro: "from-violet-400 to-fuchsia-400",
  Politics: "from-amber-400 to-rose-400",
  Tech: "from-indigo-400 to-cyan-400",
  Sports: "from-emerald-400 to-lime-400",
};

function categoryGradient(category: string): string {
  return CATEGORY_TONE[category] ?? "from-zinc-400 to-zinc-500";
}

export type ProfilePortfolioOverviewProps = {
  exposures: ReadonlyArray<PositionExposure>;
  categoryMix: ReadonlyArray<CategoryMix>;
};

function ProfilePortfolioOverviewInner({
  exposures,
  categoryMix,
}: ProfilePortfolioOverviewProps) {
  const totalNotional = useMemo(
    () => exposures.reduce((acc, e) => acc + e.notionalUsd, 0),
    [exposures],
  );
  const maxNotional = exposures[0]?.notionalUsd ?? 1;

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      aria-label="Portfolio overview"
      className="glass-panel-strong overflow-hidden rounded-2xl ring-1 ring-white/[0.06]"
    >
      <header className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-cyan-500/10 text-cyan-300 ring-1 ring-cyan-400/25">
            <Briefcase className="h-3.5 w-3.5" />
          </span>
          <div>
            <p className="text-[9.5px] font-bold uppercase tracking-[0.2em] text-zinc-500">
              Allocation
            </p>
            <h2 className="text-[14px] font-semibold tracking-tight text-white">
              Portfolio overview
            </h2>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            Notional
          </p>
          <p className="font-mono text-[14px] font-semibold tabular-nums text-zinc-100">
            {compactUsd(totalNotional)}
          </p>
        </div>
      </header>

      <div className="grid gap-4 p-4 sm:p-5 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] md:gap-5">
        {/* Top market exposures with animated bars */}
        <div className="min-w-0">
          <h3 className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-zinc-500">
            Top markets
          </h3>
          <ul className="mt-2 space-y-2">
            {exposures.slice(0, 6).map((p, i) => {
              const widthPct = Math.min(100, (p.notionalUsd / maxNotional) * 100);
              return (
                <li key={p.marketSlug}>
                  <Link
                    href={ROUTES.market(p.marketSlug)}
                    className="block rounded-lg bg-black/25 px-3 py-2 ring-1 ring-white/[0.06] transition hover:bg-black/35 hover:ring-white/[0.1]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-[12px] font-medium text-zinc-100">
                          {p.marketTitle}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1.5 text-[10px] text-zinc-500">
                          <span
                            className={cn(
                              "rounded-md px-1 py-px text-[9.5px] font-bold uppercase ring-1",
                              p.side === "YES"
                                ? "bg-cyan-500/10 text-cyan-200 ring-cyan-400/25"
                                : "bg-violet-500/10 text-violet-200 ring-violet-400/25",
                            )}
                          >
                            {p.side}
                          </span>
                          <span>{p.category}</span>
                          <span>·</span>
                          <span className="font-mono tabular-nums">
                            mark {(p.markProb * 100).toFixed(0)}%
                          </span>
                        </p>
                      </div>
                      <span className="shrink-0 font-mono text-[12.5px] font-bold tabular-nums text-zinc-100">
                        {compactUsd(p.notionalUsd)}
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.04]">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${widthPct}%` }}
                        transition={{
                          delay: i * 0.04,
                          type: "spring",
                          stiffness: 200,
                          damping: 26,
                        }}
                        className={cn(
                          "h-full rounded-full bg-gradient-to-r",
                          categoryGradient(p.category),
                        )}
                      />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Category mix */}
        <div className="min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-zinc-500">
              Category mix
            </h3>
            <Layers className="h-3 w-3 text-zinc-600" aria-hidden />
          </div>

          {/* Stacked bar */}
          <div
            className="mt-2 flex h-2 w-full overflow-hidden rounded-full bg-white/[0.04] ring-1 ring-white/[0.04]"
            role="img"
            aria-label="Category allocation"
          >
            {categoryMix.map((c, i) => (
              <motion.div
                key={c.category}
                initial={{ width: 0 }}
                animate={{ width: `${c.pct}%` }}
                transition={{
                  delay: i * 0.05,
                  duration: 0.5,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className={cn(
                  "h-full bg-gradient-to-r",
                  categoryGradient(c.category),
                )}
                aria-label={`${c.category}: ${c.pct.toFixed(0)}%`}
              />
            ))}
          </div>

          <ul className="mt-3 space-y-2">
            {categoryMix.map((c) => (
              <li
                key={c.category}
                className="flex items-center justify-between gap-2 rounded-lg bg-black/25 px-2.5 py-1.5 ring-1 ring-white/[0.05]"
              >
                <span className="flex items-center gap-2 text-[12px]">
                  <span
                    className={cn(
                      "h-2.5 w-2.5 shrink-0 rounded-full bg-gradient-to-br",
                      categoryGradient(c.category),
                    )}
                    aria-hidden
                  />
                  <span className="text-zinc-200">{c.category}</span>
                </span>
                <span className="text-right font-mono text-[11.5px] tabular-nums text-zinc-300">
                  {c.pct.toFixed(0)}%{" "}
                  <span className="text-zinc-500">{compactUsd(c.notionalUsd)}</span>
                </span>
              </li>
            ))}
          </ul>

          <Link
            href={ROUTES.portfolio}
            className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-cyan-300 transition hover:text-cyan-200"
          >
            Open full portfolio
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </motion.section>
  );
}

export const ProfilePortfolioOverview = memo(ProfilePortfolioOverviewInner);
