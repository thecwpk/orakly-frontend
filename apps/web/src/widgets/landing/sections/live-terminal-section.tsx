"use client";

import { useEffect, useState } from "react";

type Row = {
  asset: string;
  yes: number;
  no: number;
  ch: number;
};

const BASE: Row[] = [
  { asset: "PEPE · weekly cap", yes: 0.62, no: 0.38, ch: 1.2 },
  { asset: "AI lane · 24h", yes: 0.54, no: 0.46, ch: -0.4 },
  { asset: "Weekend narrative", yes: 0.71, no: 0.29, ch: 2.1 },
  { asset: "Race to $10M", yes: 0.48, no: 0.52, ch: 0.8 },
];

function fmt(n: number) {
  return (Math.round(n * 100) / 100).toFixed(2);
}

export function LiveTerminalSection() {
  const [rows, setRows] = useState(BASE);

  useEffect(() => {
    const id = window.setInterval(() => {
      setRows((prev) =>
        prev.map((r) => {
          const drift = (Math.random() - 0.5) * 0.02;
          const yes = Math.min(0.92, Math.max(0.08, r.yes + drift));
          const no = 1 - yes;
          const ch = r.ch + (Math.random() - 0.5) * 0.15;
          return { ...r, yes, no, ch };
        }),
      );
    }, 2200);
    return () => window.clearInterval(id);
  }, []);

  return (
    <section id="live-markets" className="marketing-section-slab border-b border-border py-16 sm:py-20">
      <div className="relative z-[1] mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-yes/75">Terminal preview</p>
            <h2 className="mt-2 text-2xl font-semibold text-foreground sm:text-3xl">Live conviction, demo motion</h2>
            <p className="mt-2 max-w-lg text-sm text-muted-foreground">
              Illustrative prices — shown to communicate how the desk feels when
              markets are operational.
            </p>
          </div>
          <div className="flex gap-2 font-mono text-[10px] text-muted-foreground">
            <span className="rounded border border-border px-2 py-1">USDC</span>
            <span className="rounded border border-yes/30 bg-yes/10 px-2 py-1 text-yes/90">STREAM · MOCK</span>
          </div>
        </div>

        <div className="marketing-cycle-panel mt-8 overflow-hidden rounded-xl border border-border bg-card font-mono text-[12px] shadow-inner">
          <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-2 text-[10px] uppercase tracking-wider text-muted-foreground">
            <span>Popular narratives</span>
            <span>Mid · 24h Δ</span>
          </div>
          <div className="divide-y divide-border/80">
            {rows.map((r) => (
              <div
                key={r.asset}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:flex-nowrap"
              >
                <span className="min-w-[160px] text-foreground/90">{r.asset}</span>
                <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                  <span className="text-yes/90">YES {fmt(r.yes)}</span>
                  <span className="text-no/85">NO {fmt(r.no)}</span>
                  <span className={r.ch >= 0 ? "text-yes/85" : "text-no/80"}>
                    {r.ch >= 0 ? "+" : ""}
                    {r.ch.toFixed(1)}%
                  </span>
                  <button
                    type="button"
                    className="rounded border border-border bg-muted/25 px-3 py-1 text-[11px] text-foreground transition hover:border-yes/25 hover:bg-yes/10"
                  >
                    Open
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
