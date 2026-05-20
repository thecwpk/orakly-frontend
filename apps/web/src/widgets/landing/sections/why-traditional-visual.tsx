"use client";

import { motion, useReducedMotion } from "framer-motion";

import { landingEyebrow } from "@/widgets/landing/sections/marketing-landing-rail";

const STALE_ROWS = [
  { market: "Election winner 2028?", odds: "51%", age: "6h ago" },
  { market: "Fed cut in Q2?", odds: "48%", age: "4h ago" },
  { market: "BTC above $100k?", odds: "52%", age: "5h ago" },
  { market: "Tech IPO this year?", odds: "49%", age: "7h ago" },
] as const;

/**
 * Full-panel animated “legacy catalog” mock — fills the Traditional column
 * so the comparison row feels balanced vs the dense Orakly list.
 */
export function WhyTraditionalVisual() {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className="relative flex min-h-[320px] flex-col overflow-hidden border-b border-sky-500/10 bg-[oklch(0.16_0.035_255_/_0.88)] md:min-h-[380px] md:border-b-0 md:border-r md:border-sky-400/10"
      initial={reduce ? false : { opacity: 0 }}
      whileInView={reduce ? undefined : { opacity: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5 }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] [background-size:24px_24px] wo-trad-grid-drift"
        aria-hidden
      />
      <motion.div
        className="pointer-events-none absolute -right-8 top-1/4 size-40 rounded-full bg-indigo-500/15 blur-3xl wo-trad-orb"
        aria-hidden
      />

      <motion.div className="relative z-[1] flex flex-1 flex-col p-5 md:p-6">
        <p className={landingEyebrow}>Traditional platforms</p>
        <p className="mt-2 max-w-[18rem] text-sm leading-relaxed text-muted-foreground">
          Static catalogs built for occasional bets — not intraday rotation.
        </p>

        <motion.div
          className="wo-trad-shell relative mt-5 flex flex-1 flex-col overflow-hidden rounded-xl border border-sky-500/12 bg-[oklch(0.18_0.04_252_/_0.92)] shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_24px_48px_-32px_rgba(8,16,40,0.75)]"
          initial={reduce ? false : { y: 16, opacity: 0 }}
          whileInView={reduce ? undefined : { y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.12, duration: 0.45 }}
        >
          <div className="flex items-center gap-2 border-b border-sky-500/10 bg-[oklch(0.14_0.03_258_/_0.9)] px-3 py-2">
            <span className="size-2 rounded-full bg-slate-600" aria-hidden />
            <span className="size-2 rounded-full bg-slate-600" aria-hidden />
            <span className="size-2 rounded-full bg-slate-600" aria-hidden />
            <span className="ml-2 flex-1 truncate rounded-md bg-slate-800/80 px-2 py-0.5 font-mono text-[9px] text-slate-500">
              legacy-markets.example/catalog
            </span>
            <span className="wo-trad-stale-badge shrink-0 rounded-full border border-slate-600/40 bg-slate-800/60 px-2 py-0.5 font-mono text-[8px] uppercase tracking-wider text-slate-500">
              Batch · 4h
            </span>
          </div>

          <div className="grid grid-cols-[1fr_auto_auto] gap-x-2 border-b border-sky-500/8 px-3 py-2 font-mono text-[9px] uppercase tracking-wider text-slate-500">
            <span>Market</span>
            <span className="text-right">Odds</span>
            <span className="text-right">Updated</span>
          </div>

          <ul className="relative flex-1 divide-y divide-white/[0.04] overflow-hidden">
            {STALE_ROWS.map((row, i) => (
              <motion.li
                key={row.market}
                className="wo-trad-row grid grid-cols-[1fr_auto_auto] items-center gap-x-2 px-3 py-2.5"
                style={{ animationDelay: `${i * 0.35}s` }}
                initial={reduce ? false : { opacity: 0, x: -8 }}
                whileInView={reduce ? undefined : { opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + i * 0.08, duration: 0.35 }}
              >
                <span className="truncate text-xs text-slate-500">{row.market}</span>
                <span className="wo-trad-frozen-odds font-mono text-xs tabular-nums text-slate-600">
                  {row.odds}
                </span>
                <span className="font-mono text-[10px] tabular-nums text-slate-600">{row.age}</span>
              </motion.li>
            ))}
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[oklch(0.18_0.04_252)] to-transparent"
              aria-hidden
            />
          </ul>

          <div className="relative border-t border-white/[0.05] px-3 py-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="wo-trad-spinner size-3.5 rounded-full border-2 border-slate-600 border-t-sky-400" aria-hidden />
                <span className="font-mono text-[10px] text-slate-500">Syncing catalog…</span>
              </div>
              <span className="font-mono text-[10px] text-slate-600">Live feed: off</span>
            </div>
            <motion.div
              className="wo-trad-progress mt-2 h-1 overflow-hidden rounded-full bg-slate-800/80"
              aria-hidden
            >
              <motion.div className="wo-trad-progress-bar h-full w-[38%] rounded-full bg-slate-600" />
            </motion.div>
          </div>

          <div className="wo-trad-scan pointer-events-none absolute inset-0" aria-hidden />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
