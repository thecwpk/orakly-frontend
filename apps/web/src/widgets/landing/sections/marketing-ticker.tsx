"use client";

import { motion } from "framer-motion";

const TICKER = [
  { sym: "PEPE/WEEK", yes: "62¢", ch: "+1.2%" },
  { sym: "AI vs MEME", yes: "54¢", ch: "-0.4%" },
  { sym: "NARRATIVE", yes: "71¢", ch: "+2.1%" },
  { sym: "NEW $10M", yes: "48¢", ch: "+0.8%" },
  { sym: "BTC SWING", yes: "39¢", ch: "-1.0%" },
  { sym: "WEEKEND ROT", yes: "66¢", ch: "+0.3%" },
] as const;

export function MarketingTicker() {
  const doubled = [...TICKER, ...TICKER];
  return (
    <div className="relative overflow-hidden border-y border-border bg-muted/20">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-background to-transparent" />
      <motion.div
        className="flex gap-12 whitespace-nowrap py-2.5"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 38, repeat: Infinity, ease: "linear" }}
      >
        {doubled.map((row, i) => (
          <div
            key={`${row.sym}-${i}`}
            className="flex items-center gap-3 font-mono text-[11px] text-muted-foreground"
          >
            <span className="text-muted-foreground/80">{row.sym}</span>
            <span className="text-foreground/90">YES {row.yes}</span>
            <span
              className={
                row.ch.startsWith("+") ? "text-yes/90" : "text-no/90"
              }
            >
              {row.ch}
            </span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
