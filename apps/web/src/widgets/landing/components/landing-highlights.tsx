"use client";

import { Activity, ArrowRight, LayoutGrid } from "lucide-react";
import Link from "next/link";
import { ROUTES } from "@/shared/constants/routes";

export function LandingHighlights() {
  return (
    <section
      className="mx-auto max-w-6xl px-4 pb-14 pt-4 sm:px-6 md:pb-16"
      aria-labelledby="landing-explore-heading"
    >
      <h2
        id="landing-explore-heading"
        className="mb-4 text-[12px] font-semibold uppercase tracking-[0.14em] text-zinc-500"
      >
        Continue exploring
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href={ROUTES.discover}
          className="group neon-edge-cyan glass-panel-strong relative overflow-hidden rounded-2xl p-5 transition hover:bg-white/[0.02] sm:p-6"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/15 ring-1 ring-cyan-400/25">
              <LayoutGrid className="h-5 w-5 text-cyan-300" aria-hidden />
            </div>
            <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-zinc-600 transition group-hover:translate-x-0.5 group-hover:text-cyan-400" />
          </div>
          <p className="mt-4 text-lg font-semibold text-white">Markets hub</p>
          <p className="mt-1 text-sm leading-relaxed text-zinc-500">
            Trending pools, meme lanes, and category routing — full liquidity grid.
          </p>
        </Link>

        <Link
          href="/pulse"
          className="group neon-edge-violet glass-panel-strong relative overflow-hidden rounded-2xl p-5 transition hover:bg-white/[0.02] sm:p-6"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 ring-1 ring-violet-400/25">
              <Activity className="h-5 w-5 text-violet-300" aria-hidden />
            </div>
            <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-zinc-600 transition group-hover:translate-x-0.5 group-hover:text-violet-300" />
          </div>
          <p className="mt-4 text-lg font-semibold text-white">Platform pulse</p>
          <p className="mt-1 text-sm leading-relaxed text-zinc-500">
            Live tape, surveillance metrics, and trader leaderboard.
          </p>
        </Link>
      </div>
    </section>
  );
}
