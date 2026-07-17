"use client";

import { motion } from "framer-motion";
import { useHydrationSafeReducedMotion } from "@/lib/use-hydration-safe-reduced-motion";
import { Medal } from "lucide-react";
import { SectionShell } from "../components/section-shell";

const traders = [
  { rank: 1, handle: "whale.eth", pnl: "+$2.41M", win: "62%", mkts: 418, streak: "9W" },
  { rank: 2, handle: "desk-tokyo-07", pnl: "+$1.71M", win: "58%", mkts: 612, streak: "5W" },
  { rank: 3, handle: "0xfa…90", pnl: "+$1.29M", win: "54%", mkts: 204, streak: "3W" },
  { rank: 4, handle: "arb-lab", pnl: "+$980k", win: "61%", mkts: 892, streak: "11W" },
  { rank: 5, handle: "flow-eu", pnl: "+$742k", win: "52%", mkts: 340, streak: "2W" },
  { rank: 6, handle: "sigma-mm", pnl: "+$610k", win: "57%", mkts: 128, streak: "7W" },
  { rank: 7, handle: "polymetric", pnl: "+$502k", win: "55%", mkts: 502, streak: "4W" },
  { rank: 8, handle: "liquidityfox", pnl: "+$431k", win: "53%", mkts: 267, streak: "6W" },
];

export function TopTradersSection() {
  const reduceMotion = useHydrationSafeReducedMotion();

  return (
    <SectionShell
      id="top-traders"
      eyebrow="Leaderboard"
      title="Top traders"
      description="Risk-adjusted leaderboard snapshot with anonymized handles for demo skin."
      action={
        <span className="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-[11px] font-medium text-amber-300 ring-1 ring-amber-400/25">
          <Medal className="h-3.5 w-3.5" />
          Rolling 90d
        </span>
      }
    >
      <div className="glass-panel-strong overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left text-[13px]">
            <thead>
              <tr className="border-b border-white/6 text-[11px] uppercase tracking-wider text-zinc-500">
                <th className="px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">Trader</th>
                <th className="px-4 py-3 font-medium tabular-nums">PnL</th>
                <th className="px-4 py-3 font-medium tabular-nums">Win</th>
                <th className="px-4 py-3 font-medium tabular-nums">Mkts</th>
                <th className="px-4 py-3 font-medium">Streak</th>
              </tr>
            </thead>
            <tbody>
              {traders.map((row, i) => (
                <motion.tr
                  key={row.handle}
                  initial={reduceMotion ? false : { opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: Math.min(i * 0.025, 0.15) }}
                  className="border-b border-white/4 transition hover:bg-white/3"
                >
                  <td className="px-4 py-2.5 font-mono text-xs text-zinc-500">{row.rank}</td>
                  <td className="px-4 py-2.5 font-medium text-zinc-200">{row.handle}</td>
                  <td className="px-4 py-2.5 tabular-nums text-emerald-400/95">{row.pnl}</td>
                  <td className="px-4 py-2.5 tabular-nums text-zinc-400">{row.win}</td>
                  <td className="px-4 py-2.5 tabular-nums text-zinc-400">{row.mkts}</td>
                  <td className="px-4 py-2.5 text-violet-300/90">{row.streak}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </SectionShell>
  );
}
