import type { Market } from "@orakly/types";
import { ArrowRight } from "lucide-react";

import { ComingSoonButton } from "@/widgets/landing/components/coming-soon-button";
import { DenseMarketCard } from "@/widgets/landing/components/dense-market-card";
import { cn } from "@/lib/utils";
import {
  landingEyebrow,
  landingH2,
  landingLead,
  landingBandInner,
  landingSectionBand,
} from "@/widgets/landing/sections/marketing-landing-rail";
import { LandingReveal } from "@/widgets/landing/sections/marketing-landing-layout";

/**
 * Curated 6-market preview baked at build time. The data is a static
 * mirror of `packages/database/prisma/seed.ts` so the landing surfaces
 * the same questions a freshly seeded DB serves through `/markets`.
 *
 * This is intentionally a server component — no client JS for a static
 * card grid. `DenseMarketCard` is "use client" because of the framer
 * `motion.article` reveal; the grid wrapper itself stays server-side.
 */
const SHOWCASE_MARKETS: ReadonlyArray<Market> = [
  {
    id: "btc-ath-q3-2026",
    slug: "btc-ath-q3-2026",
    title: "BTC to hit a new all-time high in Q3 2026?",
    category: "Crypto",
    volumeUsd: 9_800_000,
    liquidityUsd: 2_100_000,
    probability: 0.47,
    closesAt: "2026-09-30T23:00:00.000Z",
    status: "OPEN",
  },
  {
    id: "fed-rate-cut-july-2026",
    slug: "fed-rate-cut-july-2026",
    title: "Will the Fed cut rates before July 2026?",
    category: "Macro",
    volumeUsd: 4_200_000,
    liquidityUsd: 980_000,
    probability: 0.61,
    closesAt: "2026-07-15T23:00:00.000Z",
    status: "OPEN",
  },
  {
    id: "solana-etf-2026",
    slug: "solana-etf-2026",
    title: "Solana spot ETF approved in the US by end of 2026?",
    category: "Crypto",
    volumeUsd: 2_400_000,
    liquidityUsd: 610_000,
    probability: 0.38,
    closesAt: "2026-12-31T23:00:00.000Z",
    status: "OPEN",
  },
  {
    id: "nvidia-5trillion-mcap-2026",
    slug: "nvidia-5trillion-mcap-2026",
    title: "NVDA market cap exceeds $5T intraday before 2027?",
    category: "Macro",
    volumeUsd: 6_100_000,
    liquidityUsd: 1_400_000,
    probability: 0.42,
    closesAt: "2026-12-31T23:00:00.000Z",
    status: "OPEN",
  },
  {
    id: "new-stablecoin-act-us-2026",
    slug: "new-stablecoin-act-us-2026",
    title: "US passes federal stablecoin market-structure legislation in 2026?",
    category: "Politics",
    volumeUsd: 1_920_000,
    liquidityUsd: 480_000,
    probability: 0.36,
    closesAt: "2026-12-31T23:00:00.000Z",
    status: "OPEN",
  },
  {
    id: "gpt5-pass-bar-exam",
    slug: "gpt5-pass-bar-exam",
    title: "Will a top LLM pass a bar-exam style benchmark at ≥90% before 2027?",
    category: "Tech",
    volumeUsd: 560_000,
    liquidityUsd: 180_000,
    probability: 0.72,
    closesAt: "2026-12-01T23:00:00.000Z",
    status: "OPEN",
  },
];

const ACCENTS = ["cyan", "violet", "rose"] as const;

export function LiveMarketsGrid() {
  return (
    <section
      id="live-markets"
      className={cn(
        landingSectionBand,
        "bg-[radial-gradient(ellipse_90%_60%_at_100%_-5%,oklch(0.38_0.08_220_/_0.22),transparent_55%),radial-gradient(ellipse_70%_55%_at_0%_105%,oklch(0.24_0.05_265_/_0.16),transparent_58%),linear-gradient(188deg,oklch(0.12_0.028_255),var(--background)_52%,oklch(0.11_0.022_268))]",
        "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:z-[1] before:h-20 before:bg-gradient-to-b before:from-cyan-400/[0.07] before:via-transparent before:to-transparent",
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:64px_64px]"
        aria-hidden
      />

      <LandingReveal className={cn(landingBandInner, "relative")}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className={landingEyebrow}>Live markets</p>
            <h2 className={landingH2}>Real questions. Real odds.</h2>
            <p className={landingLead}>
              A slice of what trades right now on Orakly. Prices reflect live order flow.
            </p>
          </div>
          <ComingSoonButton className="inline-flex w-fit shrink-0 items-center gap-1.5 rounded-md border border-white/[0.08] bg-background/40 px-3.5 py-2 text-sm font-medium text-foreground transition hover:border-yes/35 hover:bg-yes/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yes/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background">
            View all markets
            <ArrowRight className="size-4" aria-hidden />
          </ComingSoonButton>
        </div>

        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SHOWCASE_MARKETS.map((m, i) => (
            <li key={m.id} className="contents">
              <DenseMarketCard market={m} accent={ACCENTS[i % ACCENTS.length]} index={i} />
            </li>
          ))}
        </ul>
      </LandingReveal>
    </section>
  );
}
