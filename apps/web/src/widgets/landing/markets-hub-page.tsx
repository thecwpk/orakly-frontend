"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { ROUTES } from "@/shared/constants/routes";
import { TrendingPredictionMarketsSection } from "@/widgets/trending-prediction-markets";
import { CategoriesSection } from "./sections/categories-section";
import { MemeTrendsSection } from "./sections/meme-trends-section";

export function MarketsHubPage() {
  return (
    <main className="flex flex-col pb-s64 pt-s48 md:pb-s72 md:pt-s56">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-r16 px-r16 sm:px-r24">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-400/90">
            Liquidity grid
          </p>
          <h1 className="mt-1.5 text-balance text-2xl font-semibold tracking-tight text-white sm:text-[1.65rem]">
            Markets — full discovery
          </h1>
        </div>
        <Link
          href={ROUTES.marketCreate}
          className="neon-edge-cyan inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-500/90 to-violet-500/85 px-3.5 py-2 text-[13px] font-semibold text-zinc-950 shadow-md shadow-cyan-500/10 transition hover:brightness-105"
        >
          <Plus className="h-3.5 w-3.5" />
          Create market
        </Link>
      </div>

      <div className="mt-s48 md:mt-s56">
        <TrendingPredictionMarketsSection limit={12} />
      </div>

      <div className="mx-auto mt-s56 flex max-w-6xl flex-col gap-s48 px-r16 sm:px-r24 md:gap-s56">
        <MemeTrendsSection />
        <CategoriesSection />
      </div>
    </main>
  );
}
