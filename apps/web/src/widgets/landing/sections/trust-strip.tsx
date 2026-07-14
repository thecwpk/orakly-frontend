import { CheckCircle2, Layers, ShieldAlert } from "lucide-react";

import { cn } from "@/lib/utils";
import { trustPillars } from "@/widgets/landing/sections/marketing-landing-content";
import {
  landingBody,
  landingEyebrow,
  landingH2,
  landingH3,
  landingLead,
  landingBandInner,
  landingSectionBand,
} from "@/widgets/landing/sections/marketing-landing-rail";
import { LandingReveal } from "@/widgets/landing/sections/marketing-landing-layout";

/**
 * Trust + security strip — fixes audit gap #11 (trust holes).
 *
 * Shipped surface:
 *   - Multi-network positioning (no single-chain lock-in in copy).
 *   - Audit-pending chip — honest signal that supersedes "audit surface"
 *     branding without showing nothing.
 *   - 4 trust pillars from `trustPillars`.
 *   - Inline risk note kept even though Terms/Privacy/Disclosure were
 *     skipped per the product owner, because the bare minimum of risk
 *     transparency cannot be skipped for a prediction market.
 */
export function TrustStrip() {
  return (
    <section
      id="trust"
      className={cn(
        landingSectionBand,
        "bg-[radial-gradient(ellipse_90%_70%_at_50%_0%,oklch(0.34_0.09_215_/_0.28),transparent_55%),radial-gradient(ellipse_60%_50%_at_100%_80%,oklch(0.28_0.06_265_/_0.18),transparent_52%),linear-gradient(188deg,oklch(0.15_0.04_252)_0%,var(--background)_48%,oklch(0.14_0.035_258)_100%)]",
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.1] [background-image:linear-gradient(rgba(125,211,252,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(125,211,252,0.04)_1px,transparent_1px)] [background-size:40px_40px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/25 to-transparent"
        aria-hidden
      />
      <LandingReveal className={cn(landingBandInner, "relative")}>
        <p className={cn(landingEyebrow, "text-cyan-200/55")}>Trust & security</p>
        <h2 className={landingH2}>On-chain settlement. Rules in the open.</h2>
        <p className={landingLead}>
          Every market ships with explicit resolution criteria and on-chain settlement.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-sky-500/25 bg-sky-500/[0.08] px-3.5 py-1.5 text-sm font-semibold text-sky-200">
            <Layers className="size-4 shrink-0 opacity-90" aria-hidden />
            Multi-chain ready
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-background/40 px-3.5 py-1.5 text-sm font-medium text-muted-foreground">
            <span className="size-1.5 rounded-full bg-amber-400/80" aria-hidden />
            Audit: pending
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-background/40 px-3.5 py-1.5 text-sm font-medium text-muted-foreground">
            Stablecoin collateral
          </span>
        </div>

        <ul className="mt-10 grid gap-3 sm:grid-cols-2">
          {trustPillars.map((p) => (
            <li
              key={p.title}
              className="flex gap-3 rounded-xl border border-sky-500/12 bg-[oklch(0.2_0.03_255_/_0.35)] p-4 backdrop-blur-sm"
            >
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-yes" strokeWidth={1.5} aria-hidden />
              <div className="min-w-0">
                <h3 className={landingH3}>{p.title}</h3>
                <p className={cn(landingBody, "mt-1")}>{p.body}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-8 flex gap-3 rounded-xl border border-amber-500/15 bg-amber-500/[0.04] p-4">
          <ShieldAlert className="mt-0.5 size-5 shrink-0 text-amber-300" aria-hidden />
          <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
            <span className="font-semibold text-foreground">Risk note.</span> Prediction markets involve loss of capital.
            Prices are volatile. Availability varies by jurisdiction. This site is not legal, tax, or financial advice.
          </p>
        </div>
      </LandingReveal>
    </section>
  );
}
