"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

function hashU32(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** PM-style floating +/- notionals on the chart (deterministic placeholder until live tape hits SVG coords). */
export function HubChartTapeOverlay({ seed }: { seed: string }) {
  const items = useMemo(() => {
    const pick = (salt: number) => hashU32(`${seed}:${salt}`);
    const mk = (i: number, sign: "+" | "-", base: number, vary: number) => {
      const p = pick(i + 17);
      const amt = base + (p % vary);
      return {
        sign,
        amt,
        topPct: 14 + (p % 55),
        leftPct: 8 + ((p >> 8) % 70),
        pos: sign === "+",
      };
    };
    return [
      mk(0, "+", 3, 38),
      mk(1, "-", 700, 450),
      mk(2, "+", 3, 22),
      mk(3, "+", 4, 30),
    ];
  }, [seed]);

  return (
    <div
      className="pointer-events-none absolute inset-x-1 inset-y-3 overflow-hidden rounded-lg"
      aria-hidden
    >
      {items.map((it, i) => (
        <span
          key={i}
          className={cn(
            "absolute font-mono text-[9.5px] font-semibold tabular-nums text-[var(--hub-fg)]/90 drop-shadow-[0_1px_3px_color-mix(in_srgb,var(--hub-bg)_90%,transparent)]",
            it.pos ? "text-emerald-400" : "text-rose-400",
          )}
          style={{ top: `${it.topPct}%`, left: `${it.leftPct}%` }}
        >
          {it.sign} ${it.amt.toLocaleString("en-US")}
        </span>
      ))}
    </div>
  );
}
