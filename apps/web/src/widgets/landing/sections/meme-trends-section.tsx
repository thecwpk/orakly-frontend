"use client";

import type { Market } from "@orakly/types";
import { motion } from "framer-motion";
import { useHydrationSafeReducedMotion } from "@/lib/use-hydration-safe-reduced-motion";
import { Flame } from "lucide-react";
import { formatCompactUsd } from "@orakly/utils";
import { SectionShell } from "../components/section-shell";

const memeMarkets: Market[] = [
  {
    id: "meme-pepe-breakout",
    slug: "meme-pepe-breakout",
    title: "PEPE flips previous ATH before August?",
    category: "Memes",
    volumeUsd: 8_200_000,
    liquidityUsd: 2_100_000,
    probability: 0.38,
    closesAt: "2026-08-01T00:00:00.000Z",
    status: "OPEN",
  },
  {
    id: "meme-wif-listings",
    slug: "meme-wif-listings",
    title: "Major CEX lists ≥3 Solana meme majors in Q3?",
    category: "Memes",
    volumeUsd: 3_400_000,
    liquidityUsd: 980_000,
    probability: 0.56,
    closesAt: "2026-09-30T23:59:59.000Z",
    status: "OPEN",
  },
  {
    id: "meme-vapor-pairs",
    slug: "meme-vapor-pairs",
    title: ">$500M memecoin FDV vaporizes in a single week?",
    category: "Memes",
    volumeUsd: 1_650_000,
    liquidityUsd: 410_000,
    probability: 0.44,
    closesAt: "2026-07-15T12:00:00.000Z",
    status: "OPEN",
  },
  {
    id: "meme-narrative-rotation",
    slug: "meme-narrative-rotation",
    title: "AI coins reclaim mindshare vs animal coins?",
    category: "Memes",
    volumeUsd: 920_000,
    liquidityUsd: 260_000,
    probability: 0.51,
    closesAt: "2026-06-22T18:00:00.000Z",
    status: "OPEN",
  },
];

export function MemeTrendsSection() {
  const reduceMotion = useHydrationSafeReducedMotion();

  return (
    <SectionShell
      id="meme-trends"
      eyebrow="Narrative velocity"
      title="Meme coin trends"
      description="High-beta flows with accelerated velocity scoring — separate lane from core crypto majors."
      action={
        <span className="flex items-center gap-1.5 rounded-full bg-rose-500/10 px-3 py-1 text-[11px] font-medium text-rose-300 ring-1 ring-rose-400/30">
          <Flame className="h-3.5 w-3.5" />
          Hot lane
        </span>
      }
    >
      <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(min(100%,260px),1fr))]">
        {memeMarkets.map((m, i) => {
          const pct = Math.round(m.probability * 100);
          return (
            <motion.article
              key={m.id}
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="neon-edge-rose glass-panel-strong w-full rounded-xl p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-md bg-rose-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-300">
                  Meme
                </span>
                <span className="font-mono text-xs text-zinc-500">{pct}% YES</span>
              </div>
              <h3 className="mt-3 line-clamp-3 text-sm font-medium leading-snug text-zinc-100">
                {m.title}
              </h3>
              <div className="mt-4 flex justify-between text-[11px] text-zinc-500">
                <span>Vol {formatCompactUsd(m.volumeUsd)}</span>
                <span>Liq {formatCompactUsd(m.liquidityUsd)}</span>
              </div>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-rose-400 to-amber-400"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </motion.article>
          );
        })}
      </div>
    </SectionShell>
  );
}
