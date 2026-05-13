"use client";

import type { Market } from "@orakly/types";
import { motion } from "framer-motion";
import { ArrowRight, CircleCheck, RotateCcw } from "lucide-react";
import Link from "next/link";
import { ROUTES } from "@/shared/constants/routes";
import { PreviewCard } from "./preview-card";
import type { CreateMarketDraft } from "@/features/markets/store/use-create-market-store";

export function SuccessScreen({
  market,
  draft,
  onCreateAnother,
}: {
  market: Market;
  draft: CreateMarketDraft;
  onCreateAnother: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="glass-panel-strong neon-edge-cyan relative overflow-hidden rounded-2xl p-5 sm:p-7"
    >
      <div className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full bg-emerald-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -left-10 -bottom-14 h-36 w-36 rounded-full bg-cyan-500/15 blur-3xl" />

      <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/15 ring-1 ring-emerald-400/40">
              <CircleCheck className="h-5 w-5 text-emerald-300" />
            </span>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-300 ring-1 ring-emerald-400/25">
              Submitted
            </span>
          </div>
          <h2 className="mt-4 text-balance text-2xl font-semibold leading-tight tracking-tight text-white sm:text-[1.65rem]">
            Your market is in the discovery feed.
          </h2>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-zinc-400">
            Liquidity will warm up as the first quotes arrive. Share the link to
            attract takers — settlement parameters lock once the first trade
            executes.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href={ROUTES.market(market.slug)}
              className="neon-edge-cyan inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500/90 to-emerald-500/85 px-4 py-2.5 text-[13px] font-semibold text-zinc-950 shadow-md shadow-cyan-500/10 transition hover:brightness-105"
            >
              Open market
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href={ROUTES.home}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/[0.05] px-4 py-2.5 text-[13px] font-medium text-zinc-200 ring-1 ring-white/10 transition hover:bg-white/[0.1]"
            >
              Back to markets
            </Link>
            <button
              type="button"
              onClick={onCreateAnother}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/[0.04] px-4 py-2.5 text-[13px] font-medium text-zinc-400 ring-1 ring-white/[0.08] transition hover:bg-white/[0.08] hover:text-zinc-100"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Create another
            </button>
          </div>
        </div>

        <div className="lg:min-w-0">
          <PreviewCard draft={draft} />
        </div>
      </div>
    </motion.div>
  );
}
