"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { MarketProbabilitySparkline } from "@/components/charts/MarketProbabilitySparkline";
import { ROUTES } from "@/shared/constants/routes";
import { cn } from "@/lib/utils";
import { LANDING_IMAGES } from "@/widgets/landing/lib/landing-image-paths";
import {
  landingHeroY,
  landingH1,
  landingLeadMuted,
  landingShell,
  landingTextGradientAccent,
} from "@/widgets/landing/sections/marketing-landing-rail";

const proof = [
  { label: "Updates", value: "Real-time" },
  { label: "Format", value: "YES / NO" },
  { label: "Settlement", value: "On-chain" },
  { label: "Rules", value: "Explicit" },
] as const;

export function MarketingLandingHero() {
  return (
    <section
      id="markets"
      className={cn(
        "relative w-full scroll-mt-28 overflow-hidden",
        "after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:z-[2] after:h-32 after:bg-gradient-to-b after:from-transparent after:via-background/40 after:to-background",
        "bg-[radial-gradient(ellipse_100%_70%_at_50%_-20%,oklch(0.38_0.12_280_/_0.22),transparent_55%),radial-gradient(90%_60%_at_0%_10%,color-mix(in_srgb,var(--yes)_16%,transparent)_0%,transparent_45%),radial-gradient(80%_55%_at_100%_0%,color-mix(in_srgb,var(--primary)_18%,transparent)_0%,transparent_48%),linear-gradient(195deg,oklch(0.14_0.03_270)_0%,hsl(var(--background))_42%,oklch(0.1_0.02_265)_100%)]",
      )}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="relative min-h-[20rem] w-full sm:min-h-[22rem] lg:min-h-[24rem]">
          <Image
            src={LANDING_IMAGES.hero}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-[center_22%] opacity-[0.08] saturate-[0.85] contrast-[1.05]"
          />
        </div>
      </div>
      <div
        className="ml-ambient-orb pointer-events-none absolute -left-24 -top-20 h-80 w-80 rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--yes)_24%,transparent),transparent_72%)]"
        aria-hidden
      />
      <div
        className="ml-ambient-orb-delayed pointer-events-none absolute -right-20 top-12 h-72 w-72 rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--primary)_20%,transparent),transparent_72%)]"
        aria-hidden
      />
      <div
        className="ml-grid-drift pointer-events-none absolute inset-0 opacity-[0.18] [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:56px_56px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.22] mix-blend-soft-light [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.04)_1px,transparent_0)] [background-size:14px_14px]"
        aria-hidden
      />

      <div className={cn(landingShell, landingHeroY, "relative")}>
        <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-background/40 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground shadow-[0_0_0_1px_color-mix(in_srgb,var(--yes)_12%,transparent),0_12px_40px_-28px_rgba(0,0,0,0.65)] backdrop-blur-md animate-hero-fade-up motion-reduce:animate-none">
          <span className="relative inline-flex size-1.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-yes opacity-40 motion-reduce:animate-none" />
            <span className="relative inline-flex size-1.5 rounded-full bg-yes shadow-[0_0_14px_color-mix(in_srgb,var(--yes)_45%,transparent)]" />
          </span>
          Live markets
        </div>

        <div className="relative mt-6 grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center lg:gap-12">
          <div className="min-w-0">
            <h1 className={cn(landingH1, "animate-hero-fade-up motion-reduce:animate-none [animation-delay:60ms]")}>
              The Prediction Market for{" "}
              <span className={landingTextGradientAccent}>Crypto Attention</span>
            </h1>
            <p
              className={cn(
                landingLeadMuted,
                "mt-3 max-w-[40rem] text-base text-foreground/85 sm:text-[1.05rem] sm:leading-snug animate-hero-fade-up motion-reduce:animate-none [animation-delay:90ms]",
              )}
            >
              Turn feeds, memes, and narrative velocity into priced YES / NO positions — with odds that move as conviction does.
            </p>
            <div className="mt-7 flex flex-wrap gap-3 animate-hero-fade-up motion-reduce:animate-none [animation-delay:120ms]">
              <Link
                href={ROUTES.dapp}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-primary to-[color:color-mix(in_srgb,var(--primary)_72%,black)] px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_16px_40px_-14px_color-mix(in_srgb,var(--primary)_70%,transparent)] ring-1 ring-white/10 transition hover:brightness-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yes focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                Launch app
                <ArrowRight className="size-4" aria-hidden />
              </Link>
              <Link
                href={ROUTES.discover}
                className="inline-flex items-center gap-2 rounded-xl border border-white/[0.1] bg-background/35 px-5 py-2.5 text-sm font-semibold text-foreground shadow-sm backdrop-blur-md transition hover:border-yes/35 hover:bg-yes/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yes/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                Explore markets
              </Link>
              <a
                href="#early-access"
                className="inline-flex items-center gap-2 rounded-xl border border-transparent bg-muted/20 px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                Early access
              </a>
            </div>
            <p className="mt-6 max-w-[38rem] text-xs leading-relaxed text-muted-foreground sm:text-sm animate-hero-fade-up motion-reduce:animate-none [animation-delay:150ms]">
              Rules and resolution criteria are visible before you trade. Pricing reflects live order flow; outcomes settle with
              on-chain verifiability.
            </p>
            <div className="relative mt-8 flex flex-wrap gap-x-10 gap-y-4 pt-8 animate-hero-fade-up motion-reduce:animate-none [animation-delay:180ms] before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-cyan-400/25 before:to-transparent">
              {proof.map((item) => (
                <div key={item.label}>
                  <p className="font-display text-lg font-bold tabular-nums text-foreground drop-shadow-[0_0_28px_rgba(34,211,238,0.22)] sm:text-xl">
                    {item.value}
                  </p>
                  <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative min-w-0">
            <div className="pointer-events-none absolute -inset-4 rounded-[1.75rem] bg-[radial-gradient(ellipse_at_50%_0%,color-mix(in_srgb,var(--yes)_16%,transparent),transparent_55%)] opacity-90 blur-2xl" aria-hidden />
            <div className="ml-preview-float relative rounded-2xl border border-white/[0.1] bg-gradient-to-b from-background/55 to-background/25 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_32px_64px_-36px_rgba(0,0,0,0.88)] backdrop-blur-xl sm:p-5 animate-hero-fade-up motion-reduce:animate-none [animation-delay:100ms]">
              <div className="flex items-center justify-between gap-3">
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Preview</p>
                <span className="rounded-full border border-yes/35 bg-yes/10 px-2.5 py-0.5 text-[10px] font-semibold text-yes">
                  Live curve
                </span>
              </div>
              <h3 className="mt-4 text-lg font-semibold leading-tight tracking-tight text-foreground sm:text-xl">
                Will BTC close above $80k this week?
              </h3>
              <div className="ml-chart-shell mt-4 h-36 rounded-xl border border-white/[0.08] bg-gradient-to-b from-muted/25 to-background/40 p-3 sm:h-40">
                <MarketProbabilitySparkline seed="landing-hero-preview" endPct={63} compact />
              </div>
              <div className="mt-3 flex items-end justify-between">
                <span className="text-sm text-muted-foreground">Implied YES</span>
                <span className="font-display text-3xl font-bold leading-none text-yes sm:text-4xl">63%</span>
              </div>
              <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
                Illustrative market — engagement and settlement labels shown for product context.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
