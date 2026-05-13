"use client";

import { motion } from "framer-motion";
import { Crown, Medal, Trophy } from "lucide-react";
import Link from "next/link";
import { Sparkline } from "@/shared/ui";
import { ROUTES } from "@/shared/constants/routes";
import { cn } from "@/lib/utils";
import { compactUsd, shortAddress, signedCompactUsd, signedPct } from "../lib/format";
import type { RankedTrader } from "../lib/types";
import { RankDelta } from "./rank-delta";

const PODIUM_META = [
  {
    rank: 1,
    icon: Crown,
    tone: "from-amber-400/22 via-amber-400/10 to-transparent",
    ring: "ring-amber-400/40",
    chip: "bg-amber-500/15 text-amber-200 ring-amber-400/30",
    spark: "amber" as const,
  },
  {
    rank: 2,
    icon: Medal,
    tone: "from-zinc-300/22 via-zinc-300/8 to-transparent",
    ring: "ring-zinc-300/30",
    chip: "bg-zinc-300/10 text-zinc-200 ring-zinc-300/30",
    spark: "violet" as const,
  },
  {
    rank: 3,
    icon: Trophy,
    tone: "from-orange-400/22 via-orange-400/8 to-transparent",
    ring: "ring-orange-400/35",
    chip: "bg-orange-500/15 text-orange-200 ring-orange-400/30",
    spark: "rose" as const,
  },
];

export function TraderPodium({ podium }: { podium: ReadonlyArray<RankedTrader> }) {
  return (
    <ol
      aria-label="Top 3 traders"
      className="grid gap-2.5 sm:grid-cols-3 sm:gap-3"
    >
      {podium.map((trader, i) => {
        const meta = PODIUM_META[i] ?? PODIUM_META[2]!;
        const Icon = meta.icon;
        const profitable = trader.pnlUsd >= 0;
        return (
          <motion.li
            key={trader.address}
            layout
            layoutId={`podium-${trader.address}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              layout: { type: "spring", stiffness: 440, damping: 36 },
              delay: i * 0.04,
              duration: 0.32,
            }}
            className={cn(
              "glass-panel-strong relative overflow-hidden rounded-2xl p-4 ring-1 sm:p-5",
              meta.ring,
            )}
          >
            <div
              aria-hidden
              className={cn(
                "pointer-events-none absolute inset-0 bg-gradient-to-br",
                meta.tone,
              )}
            />

            <header className="relative flex items-start justify-between gap-2">
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full ring-1",
                  meta.chip,
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <div className="flex items-center gap-1.5">
                <RankDelta delta={trader.rankDelta} size="xs" />
                <span
                  className={cn(
                    "rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1",
                    meta.chip,
                  )}
                >
                  Rank {trader.rank}
                </span>
              </div>
            </header>

            <div className="relative mt-4 flex items-end justify-between gap-3">
              <div className="min-w-0 flex-1">
                <Link
                  href={ROUTES.traderProfile(trader.address)}
                  className="block truncate text-[15px] font-semibold tracking-tight text-white transition hover:text-cyan-200"
                >
                  {trader.alias}
                </Link>
                <p className="mt-0.5 truncate font-mono text-[11px] text-zinc-500">
                  {shortAddress(trader.address)}
                </p>
              </div>
              <Sparkline
                data={trader.spark}
                tone={meta.spark}
                width={88}
                height={28}
                ariaLabel={`${trader.alias} equity sparkline`}
              />
            </div>

            <dl className="relative mt-4 grid grid-cols-3 gap-2 border-t border-white/[0.05] pt-3">
              <Stat
                label="PnL"
                value={signedCompactUsd(trader.pnlUsd)}
                tone={profitable ? "emerald" : "rose"}
              />
              <Stat label="ROI" value={signedPct(trader.roiPct)} tone="cyan" />
              <Stat label="Volume" value={compactUsd(trader.volumeUsd)} />
            </dl>

            <footer className="relative mt-2 flex items-center justify-between gap-2 text-[10.5px] text-zinc-500">
              <span>
                Win rate:{" "}
                <span className="font-mono font-bold tabular-nums text-zinc-300">
                  {trader.winRatePct.toFixed(0)}%
                </span>
              </span>
              <span>
                {trader.trades.toLocaleString()} trades ·{" "}
                <span className="text-violet-300/90">{trader.streak}W</span>
              </span>
            </footer>
          </motion.li>
        );
      })}
    </ol>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "emerald" | "cyan" | "rose";
}) {
  return (
    <div>
      <dt className="text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-500">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-0.5 font-mono text-[13px] font-semibold tabular-nums leading-none text-zinc-100",
          tone === "emerald" && "text-emerald-200",
          tone === "rose" && "text-rose-200",
          tone === "cyan" && "text-cyan-200",
        )}
      >
        {value}
      </dd>
    </div>
  );
}
