"use client";

import Link from "next/link";
import {
  ArrowRight,
  ChartNoAxesCombined,
  ChevronRight,
  LineChart,
  Share2,
  ShieldCheck,
  Sparkles,
  Target,
  TimerReset,
  TrendingUp,
  Trophy,
  Users,
  Zap,
} from "lucide-react";

import { MarketProbabilitySparkline } from "@/components/charts/MarketProbabilitySparkline";
import { ROUTES } from "@/shared/constants/routes";
import { cn } from "@/lib/utils";
import {
  MarketingLandingCommunity,
  MarketingLandingEarlyAccess,
  MarketingLandingFuture,
  MarketingLandingSecurity,
  MarketingLandingVision,
  MarketingLandingWhyOrakly,
} from "@/widgets/landing/sections/marketing-landing-chunks";
import { LandingReveal } from "@/widgets/landing/sections/marketing-landing-layout";
import {
  landingEyebrow,
  landingEyebrowAccent,
  landingH2,
  landingH2Editorial,
  landingH2Ultra,
  landingLeadMuted,
  landingRailSection,
  landingTextGradientSpotlight,
} from "@/widgets/landing/sections/marketing-landing-rail";

const signalTags = [
  "Meme coins",
  "Emerging narratives",
  "Momentum",
  "Rotations",
  "Sentiment",
] as const;

const exampleMarkets = [
  "Will PEPE reach a new market-cap high this week?",
  "Will AI tokens outperform meme coins in the next 24 hours?",
  "Which narrative dominates this weekend?",
  "Will a new meme coin reach $10M first?",
] as const;

const pillars = [
  {
    title: "Narrative-first markets",
    desc: "Probability tracks where attention and liquidity actually go — not generic headline baskets.",
    icon: ChartNoAxesCombined,
  },
  {
    title: "Transparent mechanics",
    desc: "Status, collateral, and resolution stay legible before you size.",
    icon: ShieldCheck,
  },
  {
    title: "Fast execution path",
    desc: "From discovery to quote to trade with minimal UI friction.",
    icon: Zap,
  },
];

const steps = [
  {
    title: "Explore markets",
    desc: "Scan live YES / NO contracts across memes, themes, and event risk.",
  },
  {
    title: "Buy YES or NO",
    desc: "Stablecoin flow; share prices read as implied probability while the market is open.",
  },
  {
    title: "Trade positions",
    desc: "Enter or exit before resolution — odds reprice with order flow.",
  },
  {
    title: "Settle on-chain",
    desc: "Winning positions redeem through published rules you can verify.",
  },
];

export function MarketingLandingSections() {
  return (
    <>
      <section
        id="market-preview"
        className={cn(
          "relative w-full scroll-mt-28 overflow-hidden",
          "bg-[radial-gradient(ellipse_90%_60%_at_100%_-5%,oklch(0.38_0.08_220_/_0.22),transparent_55%),radial-gradient(ellipse_70%_55%_at_0%_105%,oklch(0.24_0.05_265_/_0.16),transparent_58%),linear-gradient(188deg,oklch(0.12_0.028_255),hsl(var(--background))_52%,oklch(0.11_0.022_268))]",
          "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:z-[1] before:h-28 before:bg-gradient-to-b before:from-cyan-400/[0.07] before:via-transparent before:to-transparent",
        )}
      >
        <div
          className="pointer-events-none absolute inset-0 z-0 opacity-[0.14] [background-image:linear-gradient(rgba(34,211,238,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.05)_1px,transparent_1px)] [background-size:20px_20px]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute right-0 top-0 z-0 h-full w-[45%] max-w-xl bg-[radial-gradient(ellipse_at_100%_25%,oklch(0.45_0.1_200_/_0.12),transparent_68%)]"
          aria-hidden
        />
        <LandingReveal className={cn(landingRailSection, "relative z-[1]")}>
          <div className="grid gap-12 lg:grid-cols-[1.08fr_0.92fr] lg:items-start">
            <div className="min-w-0">
              <div className="flex flex-col gap-3 pb-6 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className={cn(landingEyebrowAccent, "text-sky-300/90")}>Market preview</p>
                  <h2 className={landingH2Ultra}>
                    What moves{" "}
                    <span className="text-sky-300 drop-shadow-[0_0_28px_rgba(56,189,248,0.35)]">next</span>
                  </h2>
                </div>
                <Link
                  href={ROUTES.discover}
                  className="inline-flex w-fit shrink-0 items-center gap-1 text-sm font-medium text-foreground/90 transition hover:text-yes focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yes/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  View markets
                  <ChevronRight className="size-4" aria-hidden />
                </Link>
              </div>
              <p className={landingLeadMuted}>
                Crypto-native questions with continuous repricing — the number is the narrative, not the recap thread.
              </p>
              <ul className="mt-5 flex flex-wrap gap-2">
                {signalTags.map((t) => (
                  <li
                    key={t}
                    className="rounded-full border border-cyan-500/15 bg-cyan-500/[0.04] px-3 py-1.5 text-xs font-medium text-foreground/90 backdrop-blur-sm transition hover:border-sky-400/35 hover:bg-sky-400/[0.07]"
                  >
                    {t}
                  </li>
                ))}
              </ul>
              <p className="mt-8 font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-300/70">
                Example markets
              </p>
              <p className="mt-2 max-w-[42rem] text-sm leading-relaxed text-muted-foreground">
                Liquidity shifts rewrite the implied curve in real time.{" "}
                <span className="font-medium text-foreground/90">Trade the update, not the headline.</span>
              </p>
            </div>
            <div className="relative min-w-0">
              <div className="pointer-events-none absolute -right-6 top-8 hidden h-52 w-52 rounded-full bg-[radial-gradient(circle,oklch(0.55_0.12_220_/_0.2),transparent_68%)] blur-3xl lg:block" aria-hidden />
              <div className="space-y-3 lg:-translate-y-1 lg:pl-2">
                {exampleMarkets.map((q, i) => (
                  <article
                    key={q}
                    className="group relative overflow-hidden rounded-xl border border-cyan-500/10 bg-gradient-to-br from-background/70 via-background/35 to-cyan-950/20 py-3 pl-4 pr-3 shadow-[0_24px_56px_-40px_rgba(0,0,0,0.88),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-md transition hover:border-cyan-400/25 hover:shadow-[0_28px_60px_-36px_rgba(34,211,238,0.12)]"
                  >
                    <span className="font-mono text-[10px] tabular-nums tracking-widest text-cyan-400/80">
                      IDX_{String(i + 1).padStart(2, "0")}
                    </span>
                    <p className="mt-1 text-sm font-medium leading-snug text-foreground">{q}</p>
                    <div className="pointer-events-none absolute inset-y-0 left-0 w-px bg-gradient-to-b from-cyan-400/70 via-sky-400/25 to-transparent opacity-0 transition group-hover:opacity-100" aria-hidden />
                  </article>
                ))}
              </div>
            </div>
          </div>
        </LandingReveal>
      </section>

      <section
        className={cn(
          "relative w-full overflow-hidden",
          "bg-[radial-gradient(ellipse_85%_70%_at_15%_100%,oklch(0.32_0.05_55_/_0.2),transparent_58%),linear-gradient(178deg,oklch(0.16_0.02_55),hsl(var(--background))_40%,oklch(0.13_0.015_45))]",
          "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-20 before:bg-gradient-to-b before:from-amber-500/[0.04] before:to-transparent",
        )}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.2] mix-blend-overlay [background-image:radial-gradient(circle_at_1px_1px,rgba(255,250,240,0.04)_1px,transparent_0)] [background-size:18px_18px]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute left-0 top-1/2 h-[min(85%,30rem)] w-full -translate-y-1/2 bg-[radial-gradient(ellipse_55%_50%_at_25%_50%,oklch(0.35_0.06_85_/_0.1),transparent_62%)]"
          aria-hidden
        />
        <LandingReveal className={cn(landingRailSection, "relative")}>
          <p className={landingEyebrow}>Core advantage</p>
          <h2 className={landingH2Editorial}>Clarity over chrome</h2>
          <p className={landingLeadMuted}>
            Read implied probability fast, size with fewer steps, and see resolution rules before you commit.
          </p>

          <div className="relative mt-10 grid gap-4 lg:grid-cols-3">
            {pillars.map((item) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.title}
                  className="group relative overflow-hidden rounded-2xl border border-white/[0.05] bg-gradient-to-b from-white/[0.035] to-transparent p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] ring-1 ring-amber-950/20 transition hover:ring-amber-500/15 hover:shadow-[0_24px_48px_-32px_rgba(0,0,0,0.55)]"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
                    <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-background/50 text-amber-200/90 shadow-inner">
                      <Icon className="size-4" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold tracking-tight text-foreground">{item.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </LandingReveal>
      </section>

      <MarketingLandingVision />

      <MarketingLandingWhyOrakly />

      <section
        id="features"
        className={cn(
          "relative w-full scroll-mt-28 overflow-hidden",
          "bg-[radial-gradient(ellipse_100%_80%_at_75%_-10%,oklch(0.34_0.04_270_/_0.14),transparent_52%),linear-gradient(168deg,hsl(var(--background))_0%,oklch(0.145_0.012_260)_42%,hsl(var(--background))_100%)]",
        )}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.5] [background-image:linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] [background-size:100%_1.5rem]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute left-0 top-[20%] h-[min(32rem,70vh)] w-[min(28rem,55vw)] -translate-x-[15%] bg-[radial-gradient(ellipse_at_center,oklch(0.38_0.06_285_/_0.1),transparent_70%)] blur-3xl"
          aria-hidden
        />
        <LandingReveal className={cn(landingRailSection, "relative z-[1]")}>
          <p className={cn(landingEyebrow, "tracking-[0.28em] text-foreground/50")}>Product surface</p>
          <h2 className={cn(landingH2, "!mt-4 font-normal tracking-[-0.02em] text-foreground/95 lg:!text-[2.2rem]")}>
            One desk, <span className="font-semibold text-foreground">many jobs</span>
          </h2>
          <p className={landingLeadMuted}>
            Discovery, sizing, reputation, and settlement — each tuned differently so the page does not read like one repeated card.
          </p>
          <div className="mt-8 grid auto-rows-min gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <article className="flex flex-col rounded-3xl border border-white/[0.06] bg-gradient-to-b from-zinc-900/40 via-background/30 to-transparent p-5 shadow-[0_40px_80px_-48px_rgba(0,0,0,0.85)] backdrop-blur-xl sm:col-span-2 lg:col-span-4 lg:row-span-2 lg:p-7">
              <TrendingUp className="size-6 text-yes" strokeWidth={1.35} aria-hidden />
              <h3 className="mt-4 text-lg font-semibold text-foreground">Narrative trading</h3>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
                <span className="font-medium text-foreground/90">Position on themes</span> before they compress into generic news
                coverage.
              </p>
              <div className="mt-6 min-h-[10rem] flex-1 rounded-2xl border border-white/[0.06] bg-gradient-to-b from-muted/20 to-background/30 p-3 sm:min-h-[11rem]">
                <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                  <span>Implied curve</span>
                  <span className="text-yes">YES lean</span>
                </div>
                <div className="mt-2 h-28 sm:h-32">
                  <MarketProbabilitySparkline seed="landing-features-bento" endPct={58} compact />
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  Compact read — probability moves with flow, not a separate analytics tab.
                </p>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-muted/15 p-4 ring-1 ring-white/[0.05]">
                  <LineChart className="size-5 text-yes" strokeWidth={1.35} aria-hidden />
                  <h4 className="mt-2 text-sm font-semibold text-foreground">Live repricing</h4>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Belief updates on each print.</p>
                </div>
                <div className="rounded-xl border border-dashed border-white/[0.1] bg-background/30 p-4">
                  <Zap className="size-5 text-yes" strokeWidth={1.35} aria-hidden />
                  <h4 className="mt-2 text-sm font-semibold text-foreground">Open / close</h4>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Adjust exposure before resolution.</p>
                </div>
              </div>
            </article>
            <article className="rounded-2xl bg-background/55 p-5 ring-1 ring-white/[0.06] backdrop-blur-sm sm:col-span-1 lg:col-span-2 lg:col-start-5 lg:row-start-1">
              <Target className="size-6 text-yes" strokeWidth={1.35} aria-hidden />
              <h3 className="mt-4 text-base font-semibold text-foreground">Meme &amp; sector risk</h3>
              <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="text-yes/80">·</span> Milestones &amp; rotations
                </li>
                <li className="flex gap-2">
                  <span className="text-yes/80">·</span> Token momentum
                </li>
                <li className="flex gap-2">
                  <span className="text-yes/80">·</span> Relative performance
                </li>
              </ul>
            </article>
            <article className="rounded-2xl border border-white/[0.07] bg-gradient-to-br from-yes/[0.06] to-transparent p-5 backdrop-blur-sm sm:col-span-1 lg:col-span-2 lg:col-start-5 lg:row-start-2">
              <Users className="size-6 text-yes" strokeWidth={1.35} aria-hidden />
              <h3 className="mt-4 text-base font-semibold text-foreground">Community discovery</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Suggest markets, surface narratives early, and let the crowd pull what trades next.
              </p>
            </article>
            <article className="rounded-xl border border-white/[0.06] bg-background/40 p-5 backdrop-blur-md sm:col-span-1 lg:col-span-3 lg:row-start-3">
              <ShieldCheck className="size-6 text-yes" strokeWidth={1.35} aria-hidden />
              <h3 className="mt-4 text-base font-semibold text-foreground">Transparent settlement</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Resolution criteria stay legible — you know what you are underwriting.
              </p>
            </article>
            <article className="rounded-2xl bg-muted/10 p-5 ring-1 ring-inset ring-white/[0.04] sm:col-span-1 lg:col-span-3 lg:row-start-3">
              <Trophy className="size-6 text-yes" strokeWidth={1.35} aria-hidden />
              <h3 className="mt-4 text-base font-semibold text-foreground">Reputation</h3>
              <p className="mt-2 text-sm text-muted-foreground">Win rate, accuracy, leaderboards — performance as signal.</p>
            </article>
            <article className="rounded-2xl border border-border/40 bg-gradient-to-r from-background/80 to-muted/15 p-5 sm:col-span-2 lg:col-span-6 lg:row-start-4">
              <Share2 className="size-6 text-yes" strokeWidth={1.35} aria-hidden />
              <h3 className="mt-4 text-lg font-semibold text-foreground">Shareable markets</h3>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                Deep links and social surfaces built for viral discovery — without hiding rules behind auth walls.
              </p>
            </article>
          </div>
        </LandingReveal>
      </section>

      <section
        id="how-it-works"
        className={cn(
          "relative w-full scroll-mt-28 overflow-hidden",
          "bg-[linear-gradient(185deg,oklch(0.14_0.02_255)_0%,hsl(var(--background))_38%,oklch(0.13_0.018_250)_100%)]",
        )}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:32px_32px]"
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/20 to-transparent" aria-hidden />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" aria-hidden />
        <LandingReveal className={landingRailSection}>
          <div className="mb-8 flex w-full min-w-0 flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <Sparkles className="size-4 shrink-0 text-indigo-400/90" aria-hidden />
              <p className={landingEyebrow}>How Orakly works</p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/[0.06] px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-wide text-indigo-200/80 backdrop-blur-sm">
              <TimerReset className="size-3.5 text-indigo-300" aria-hidden />
              Live cycle
            </span>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(260px,1fr)_460px_minmax(260px,1fr)] lg:items-center lg:gap-6">
            <div className="space-y-3">
              {[steps[0], steps[2]].map((s, i) =>
                s ? (
                  <article
                    key={s.title}
                    className="rounded-2xl border border-white/[0.1] bg-white/[0.035] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.07)] backdrop-blur-xl transition hover:border-indigo-400/30 hover:bg-white/[0.055]"
                  >
                    <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      {i === 0 ? "Browse" : "Conviction"}
                    </p>
                    <h3 className="mt-1.5 text-sm font-semibold text-foreground">{s.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
                  </article>
                ) : null,
              )}
            </div>

            <div className="hw-cycle-wrap">
              <div className="hw-cycle-ring" aria-hidden />
              <div className="hw-cycle-glass" aria-hidden />
              <div className="hw-cycle-core">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Orakly loop</p>
                <p className="mt-1 font-display text-base font-bold leading-tight text-foreground">
                  Discover
                  <br />
                  Trade
                  <br />
                  Settle
                </p>
              </div>
              {steps.map((s, i) => (
                <div key={s.title} className={cn("hw-node", `hw-node-${i}`)}>
                  <span className="hw-node-dot" aria-hidden />
                  <span className="hw-node-label">
                    <strong>Step {i + 1}</strong>
                    <span>{s.title}</span>
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              {[steps[1], steps[3]].map((s, i) =>
                s ? (
                  <article
                    key={s.title}
                    className="rounded-2xl border border-white/[0.1] bg-white/[0.035] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.07)] backdrop-blur-xl transition hover:border-indigo-400/30 hover:bg-white/[0.055]"
                  >
                    <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      {i === 0 ? "Sides" : "Finality"}
                    </p>
                    <h3 className="mt-1.5 text-sm font-semibold text-foreground">{s.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
                  </article>
                ) : null,
              )}
            </div>
          </div>
        </LandingReveal>
      </section>

      <MarketingLandingCommunity />

      <MarketingLandingSecurity />

      <MarketingLandingFuture />

      <MarketingLandingEarlyAccess />

      <section
        id="final-cta"
        className={cn(
          "relative w-full scroll-mt-28 overflow-hidden",
          "bg-[radial-gradient(ellipse_100%_90%_at_50%_-25%,oklch(0.42_0.16_285_/_0.35),transparent_55%),radial-gradient(ellipse_55%_45%_at_0%_100%,oklch(0.32_0.12_270_/_0.22),transparent_60%),linear-gradient(188deg,oklch(0.1_0.03_275),hsl(var(--background))_45%,oklch(0.09_0.025_280))]",
        )}
      >
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_80%_20%,oklch(0.5_0.08_220_/_0.08),transparent_65%)]"
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-400/30 to-transparent" aria-hidden />
        <LandingReveal className={cn(landingRailSection, "relative text-left")}>
          <h2 className="max-w-[22ch] font-display text-3xl font-extrabold leading-[1.08] tracking-[-0.03em] sm:text-4xl lg:text-[2.75rem]">
            <span className={landingTextGradientSpotlight}>Price the narrative</span>
            <span className="mt-1 block text-foreground/90">— not only the candle</span>
          </h2>
          <p className={cn(landingLeadMuted, "mt-4 max-w-[42rem]")}>
            Binary markets on crypto-native questions — commit size in the app once you have read the rules.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={ROUTES.markets}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yes focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Launch app
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <a
              href="#early-access"
              className="inline-flex items-center rounded-xl border border-border/75 bg-muted/20 px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/25 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Join early access
            </a>
          </div>
        </LandingReveal>
      </section>

      <footer
        id="footer"
        className={cn(
          "relative w-full scroll-mt-28 overflow-hidden",
          "bg-[linear-gradient(180deg,oklch(0.11_0.022_262)_0%,oklch(0.095_0.02_268)_100%)]",
        )}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.025)_1px,transparent_0)] [background-size:24px_24px]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -left-16 -top-16 h-40 w-40 rounded-full bg-[radial-gradient(circle,oklch(0.4_0.06_270_/_0.12),transparent_72%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-14 bottom-0 h-36 w-36 rounded-full bg-[radial-gradient(circle,oklch(0.38_0.05_240_/_0.1),transparent_72%)]"
          aria-hidden
        />

        <div className={cn(landingRailSection, "relative")}>
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8 lg:items-start">
            <div className="sm:col-span-2 lg:col-span-1">
              <p className="font-display text-lg font-bold tracking-tight text-foreground">ORAKLY MARKET</p>
              <p className="mt-3 max-w-sm text-xs leading-relaxed text-muted-foreground sm:text-sm">
                YES / NO markets on crypto attention — live odds, explicit settlement, verifiable outcomes.
              </p>
            </div>

            <div>
              <p className={landingEyebrow}>Product</p>
              <nav className="mt-3 flex flex-col gap-1.5 text-sm" aria-label="Footer product links">
                <Link
                  href={ROUTES.discover}
                  className="text-foreground/90 transition hover:text-yes focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yes/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  Markets
                </Link>
                <Link
                  href={ROUTES.markets}
                  className="text-foreground/90 transition hover:text-yes focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yes/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  Launch app
                </Link>
                <a
                  href="#features"
                  className="text-foreground/90 transition hover:text-yes focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yes/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  Features
                </a>
              </nav>
            </div>

            <div>
              <p className={landingEyebrow}>Resources</p>
              <nav className="mt-3 flex flex-col gap-1.5 text-sm" aria-label="Footer resource links">
                <Link
                  href={ROUTES.discover}
                  className="text-foreground/90 transition hover:text-yes focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yes/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  Docs
                </Link>
                <a
                  href="#community"
                  className="text-foreground/90 transition hover:text-yes focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yes/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  Community
                </a>
                <a
                  href="#early-access"
                  className="text-foreground/90 transition hover:text-yes focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yes/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  Early access
                </a>
                <a
                  href="#how-it-works"
                  className="text-foreground/90 transition hover:text-yes focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yes/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  How it works
                </a>
              </nav>
            </div>

            <div>
              <p className={landingEyebrow}>Social</p>
              <nav className="mt-3 flex flex-col gap-1.5 text-sm" aria-label="Social links">
                <a
                  href="https://x.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground/90 transition hover:text-yes focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yes/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  X / Twitter
                </a>
                <a
                  href="https://telegram.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground/90 transition hover:text-yes focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yes/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  Telegram
                </a>
                <a
                  href="https://discord.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground/90 transition hover:text-yes focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yes/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  Discord
                </a>
              </nav>
            </div>
          </div>

          <div className="relative mt-10 flex flex-col gap-2 pt-6 before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/[0.07] before:to-transparent sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">© 2026 Orakly Market. Prediction markets for crypto attention.</p>
            <p className="font-mono text-[11px] text-muted-foreground">Status: beta · English</p>
          </div>
        </div>
      </footer>
    </>
  );
}
