import Link from "next/link";
import { ArrowRight, TrendingUp } from "lucide-react";

import { ROUTES } from "@/shared/constants/routes";
import { cn } from "@/lib/utils";
import { StaticMarketSparkline } from "@/widgets/landing/components/static-market-sparkline";
import { heroProofStats } from "@/widgets/landing/sections/marketing-landing-content";
import {
  landingDisplay,
  landingHeroY,
  landingLead,
  landingShell,
} from "@/widgets/landing/sections/marketing-landing-rail";

const NEW_TAB = { target: "_blank" as const, rel: "noopener noreferrer" as const };

/**
 * Hero — fixes audit gaps #2, #6, #7, #13, #15.
 *
 * - 2 CTAs (primary `Launch app`, secondary `Explore markets`), not 3.
 * - 9-word subhead (was 23): `Trade live YES/NO odds on crypto, macro, and more.`
 * - Preview uses a static example market card with SVG sparkline (no client chart).
 * - Proof strip highlights live depth, breadth, and on-chain settlement (no fixed counts).
 * - Background FX collapsed: 1 base gradient + 1 grid (was 5 stacked layers).
 * - Mobile layout uses `flex-col-reverse` so the headline + CTAs hit fold first.
 */
export function MarketingLandingHero() {
  return (
    <section
      id="markets"
      className={cn(
        "relative w-full scroll-mt-28 overflow-hidden",
        "bg-[radial-gradient(ellipse_120%_70%_at_50%_-10%,oklch(0.32_0.08_270_/_0.35),transparent_55%),linear-gradient(180deg,oklch(0.13_0.025_265)_0%,hsl(var(--background))_70%)]",
      )}
    >
      <div
        className="pointer-events-none absolute -left-24 top-16 size-72 rounded-full bg-[radial-gradient(circle,oklch(0.45_0.12_270_/_0.2),transparent_70%)] ml-ambient-orb blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-16 bottom-8 size-64 rounded-full bg-[radial-gradient(circle,oklch(0.42_0.1_200_/_0.18),transparent_70%)] ml-ambient-orb-delayed blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.12] ml-grid-drift [background-image:linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px)] [background-size:48px_48px] sm:[background-size:64px_64px]"
        aria-hidden
      />

      <div className={cn(landingShell, landingHeroY, "relative")}>
        <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-background/40 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground shadow-[0_0_0_1px_color-mix(in_srgb,var(--yes)_12%,transparent),0_12px_40px_-28px_rgba(0,0,0,0.65)] backdrop-blur-md">
          <span className="relative inline-flex size-1.5">
            <span className="motion-safe:animate-ping absolute inline-flex size-full rounded-full bg-yes opacity-40" />
            <span className="relative inline-flex size-1.5 rounded-full bg-yes shadow-[0_0_14px_color-mix(in_srgb,var(--yes)_45%,transparent)]" />
          </span>
          Live · On-chain
        </div>

        <div className="relative mt-6 flex flex-col-reverse gap-10 lg:grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-center lg:gap-12">
          <div className="min-w-0">
            <h1 className={landingDisplay}>
              Trade conviction.
              <br />
              <span className="text-yes">YES</span> or <span className="text-foreground">NO</span>.
            </h1>
            <p className={cn(landingLead, "text-foreground")}>
              On-chain prediction markets on crypto, macro, and tech.
            </p>

            <div className="mt-7 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
              <Link
                href={ROUTES.dapp}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-primary to-[color:color-mix(in_srgb,var(--primary)_72%,black)] px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_16px_40px_-14px_color-mix(in_srgb,var(--primary)_70%,transparent)] ring-1 ring-white/10 transition hover:brightness-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yes focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                {...NEW_TAB}
              >
                Launch app
                <ArrowRight className="size-4" aria-hidden />
              </Link>
              <Link
                href={ROUTES.discover}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.1] bg-background/35 px-5 py-2.5 text-sm font-semibold text-foreground shadow-sm backdrop-blur-md transition hover:border-yes/35 hover:bg-yes/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yes/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                {...NEW_TAB}
              >
                Explore markets
              </Link>
            </div>

            <dl className="relative mt-8 grid grid-cols-2 gap-x-8 gap-y-4 border-t border-white/[0.06] pt-6 sm:grid-cols-4">
              {heroProofStats.map((stat) => (
                <div key={stat.label}>
                  <dt className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    {stat.label}
                  </dt>
                  <dd className="mt-1 font-display text-lg font-bold tabular-nums text-foreground sm:text-xl">
                    {stat.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative min-w-0">
            <div
              className="pointer-events-none absolute -inset-4 rounded-[1.75rem] bg-[radial-gradient(ellipse_at_50%_0%,color-mix(in_srgb,var(--yes)_14%,transparent),transparent_55%)] opacity-90 blur-2xl"
              aria-hidden
            />
            <article className="ml-preview-float relative rounded-2xl border border-white/[0.1] bg-gradient-to-b from-background/55 to-background/25 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_32px_64px_-36px_rgba(0,0,0,0.88)] backdrop-blur-xl">
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-full border border-white/[0.08] bg-background/40 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Crypto
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-yes/35 bg-yes/10 px-2.5 py-0.5 text-[10px] font-semibold text-yes">
                  <TrendingUp className="size-3" aria-hidden />
                  Live
                </span>
              </div>

              <h2 className="mt-4 text-lg font-semibold leading-tight tracking-tight text-foreground sm:text-xl">
                Solana spot ETF approved in the US by end of 2026?
              </h2>
              <p className="mt-2 text-xs text-muted-foreground">
                Vol $2.4M · Liq $610K · Closes Dec 31, 2026
              </p>

              <div className="ml-chart-shell mt-4 h-28 rounded-xl border border-white/[0.08] bg-gradient-to-b from-muted/25 to-background/40 p-3">
                <StaticMarketSparkline endPct={38} className="h-full w-full" />
              </div>

              <div className="mt-4 flex items-end justify-between">
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    Implied YES
                  </p>
                  <p className="mt-1 font-display text-3xl font-bold leading-none text-yes tabular-nums sm:text-4xl">
                    38%
                  </p>
                </div>
                <div className="flex gap-2">
                  <span className="rounded-md border border-yes/30 bg-yes/10 px-3 py-2 text-xs font-semibold text-yes">
                    Buy YES
                  </span>
                  <span className="rounded-md border border-no/30 bg-no/10 px-3 py-2 text-xs font-semibold text-no">
                    Buy NO
                  </span>
                </div>
              </div>

              <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
                Live preview. Open the app to size positions and see the full order book.
              </p>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
