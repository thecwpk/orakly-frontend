"use client";

import { motion } from "framer-motion";

export function HeroDashboardPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[520px] lg:mx-0">
      <div className="absolute -inset-4 rounded-[28px] bg-gradient-to-br from-yes/15 via-transparent to-primary/10 blur-2xl" aria-hidden />
      <motion.div
        className="marketing-cycle-panel marketing-cycle-panel--glow relative overflow-hidden rounded-2xl border border-border shadow-[0_24px_80px_-24px_rgba(0,0,0,0.85)]"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <div className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-no/75" />
            <span className="size-2.5 rounded-full bg-primary/65" />
            <span className="size-2.5 rounded-full bg-yes/70" />
          </div>
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Orakly · Narrative desk
          </span>
          <span className="rounded border border-yes/30 bg-yes/10 px-2 py-0.5 font-mono text-[10px] text-yes">
            LIVE
          </span>
        </div>

        <div className="grid gap-0 md:grid-cols-[140px_1fr]">
          <div className="hidden border-r border-border bg-muted/25 p-3 md:block">
            <p className="mb-2 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Watchlist</p>
            <ul className="space-y-2 text-[11px]">
              <li className="flex justify-between text-foreground/90">
                <span>PEPE cap</span>
                <span className="font-mono text-yes/90">62%</span>
              </li>
              <li className="flex justify-between text-muted-foreground">
                <span>AI lane</span>
                <span className="font-mono text-muted-foreground">54%</span>
              </li>
              <li className="flex justify-between text-muted-foreground">
                <span>$10M race</span>
                <span className="font-mono text-muted-foreground">48%</span>
              </li>
            </ul>
          </div>

          <div className="p-4">
            <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Active market</p>
                <p className="mt-1 max-w-[280px] text-sm font-medium leading-snug text-card-foreground">
                  Will PEPE hit a new market cap high this week?
                </p>
              </div>
              <div className="text-right">
                <p className="font-mono text-[10px] text-muted-foreground">Mid</p>
                <motion.p
                  className="font-mono text-lg font-semibold tabular-nums text-primary"
                  animate={{ opacity: [1, 0.82, 1] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  0.62 USDC
                </motion.p>
              </div>
            </div>

            <div className="marketing-chart-shimmer relative mb-4 h-[120px] rounded-lg border border-border bg-gradient-to-b from-muted/30 to-transparent p-3">
              <svg className="size-full overflow-visible text-yes" viewBox="0 0 320 80" preserveAspectRatio="none" aria-hidden>
                <defs>
                  <linearGradient id="heroGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--yes)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--yes)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <motion.path
                  fill="url(#heroGrad)"
                  d="M0,55 Q40,48 80,52 T160,38 T240,44 T320,30 L320,80 L0,80 Z"
                  animate={{
                    d: [
                      "M0,55 Q40,48 80,52 T160,38 T240,44 T320,30 L320,80 L0,80 Z",
                      "M0,52 Q40,58 80,45 T160,42 T240,36 T320,34 L320,80 L0,80 Z",
                      "M0,55 Q40,48 80,52 T160,38 T240,44 T320,30 L320,80 L0,80 Z",
                    ],
                  }}
                  transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.path
                  fill="none"
                  className="stroke-yes"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  d="M0,55 Q40,48 80,52 T160,38 T240,44 T320,30"
                  animate={{
                    d: [
                      "M0,55 Q40,48 80,52 T160,38 T240,44 T320,30",
                      "M0,52 Q40,58 80,45 T160,42 T240,36 T320,34",
                      "M0,55 Q40,48 80,52 T160,38 T240,44 T320,30",
                    ],
                  }}
                  transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
                />
              </svg>
              <div className="absolute bottom-2 left-3 flex gap-3 font-mono text-[9px] text-muted-foreground">
                <span>24h vol</span>
                <span className="text-muted-foreground/90">$2.4M</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                className="rounded-lg border border-yes/30 bg-yes/10 py-2.5 text-center text-[13px] font-semibold text-yes ring-1 ring-yes/25"
              >
                Buy YES · 62¢
              </button>
              <button
                type="button"
                className="rounded-lg border border-no/28 bg-no/14 py-2.5 text-center text-[13px] font-semibold text-no ring-1 ring-no/22"
              >
                Buy NO · 38¢
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
