"use client";

import Image from "next/image";
import { CheckCircle2, Megaphone, TrendingUp, Trophy, Users } from "lucide-react";

import { LANDING_IMAGES } from "@/widgets/landing/lib/landing-image-paths";
import { cn } from "@/lib/utils";
import { LandingReveal } from "@/widgets/landing/sections/marketing-landing-layout";
import {
  communityFeatures,
  earlyAccessBullets,
  futureRoadmap,
  securityItems,
  visionPoints,
  visionSpecStrip,
  whyOraklyBridgeColumns,
  whyOraklyFeatures,
} from "@/widgets/landing/sections/marketing-landing-content";
import {
  landingEyebrow,
  landingEyebrowAccent,
  landingH2,
  landingH2Editorial,
  landingH2Ultra,
  landingLead,
  landingLeadMuted,
  landingRailSection,
  landingTextGradientAccent,
} from "@/widgets/landing/sections/marketing-landing-rail";

const communityStats = [
  { label: "Liquidity story", value: "Community-led" },
  { label: "Market ideas", value: "Crowdsourced" },
  { label: "Reputation", value: "On-chain friendly" },
] as const;

export function MarketingLandingVision() {
  return (
    <section
      id="vision"
      className={cn(
        "relative w-full scroll-mt-28 overflow-hidden",
        "bg-[radial-gradient(ellipse_95%_75%_at_50%_-30%,oklch(0.45_0.14_290_/_0.22),transparent_52%),radial-gradient(ellipse_70%_55%_at_0%_80%,oklch(0.28_0.06_280_/_0.14),transparent_60%),linear-gradient(185deg,hsl(var(--background))_0%,oklch(0.13_0.025_275)_55%,hsl(var(--background)))]",
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_40%,oklch(0.5_0.06_250_/_0.06),transparent_65%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.15] mix-blend-soft-light [background-image:linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:100%_2rem]"
        aria-hidden
      />
      <LandingReveal className={cn(landingRailSection, "relative")}>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.06fr)_minmax(240px,0.84fr)] lg:items-start lg:gap-12">
          <div className="min-w-0 text-left">
            <p className={landingEyebrow}>The vision</p>
            <h2 className={cn(landingH2, "font-extrabold tracking-[-0.035em] lg:text-[2.15rem]")}>
              What you trade when you trade{" "}
              <span className={landingTextGradientAccent}>attention</span>
            </h2>
            <p className={landingLeadMuted}>
              Orakly maps narratives and conviction to live YES / NO markets — act on the story, not only the candle.
            </p>
            <blockquote className="mt-7 border-l border-transparent bg-gradient-to-r from-violet-500/15 to-transparent py-1 pl-5 text-base font-light italic leading-relaxed text-foreground/90 sm:text-lg sm:leading-relaxed">
              Attention and sentiment move first; price follows. The market layer makes that legible.
            </blockquote>
            <ul className="mt-6 space-y-3.5">
              {visionPoints.map((row) => (
                <li key={row.title} className="flex gap-3">
                  <span className="mt-2 size-1 shrink-0 rounded-full bg-yes/80 shadow-[0_0_12px_color-mix(in_srgb,var(--yes)_35%,transparent)]" aria-hidden />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{row.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{row.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <aside className="min-w-0 lg:pt-1">
            <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-background/35 shadow-[0_28px_56px_-36px_rgba(0,0,0,0.82)] backdrop-blur-xl">
              <div className="relative flex min-h-[7rem] items-center justify-center bg-[linear-gradient(168deg,color-mix(in_oklch,var(--muted)_32%,transparent),color-mix(in_oklch,var(--card)_18%,transparent))] px-5 py-6 sm:min-h-[7.5rem]">
                <Image
                  src={LANDING_IMAGES.visionBrandMark}
                  alt="Orakly"
                  width={180}
                  height={40}
                  className="h-auto w-full max-w-[min(100%,17.5rem)] object-contain object-center opacity-95 [filter:drop-shadow(0_12px_28px_rgba(0,0,0,0.5))]"
                  priority={false}
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
              </div>
              <div className="border-t border-white/[0.07] bg-background/50 px-4 py-3">
                <p className={landingEyebrow}>At a glance</p>
                <dl className="mt-3 space-y-2">
                  {visionSpecStrip.map((row) => (
                    <div key={row.k} className="flex items-baseline justify-between gap-2 text-sm">
                      <dt className="text-muted-foreground">{row.k}</dt>
                      <dd className="text-right font-medium text-foreground">{row.v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </aside>
        </div>
      </LandingReveal>
    </section>
  );
}

export function MarketingLandingWhyOrakly() {
  return (
    <section
      className={cn(
        "relative w-full overflow-hidden",
        "bg-[radial-gradient(ellipse_80%_60%_at_100%_0%,oklch(0.22_0.04_285_/_0.35),transparent_55%),linear-gradient(188deg,oklch(0.08_0.02_275),hsl(var(--background))_50%,oklch(0.1_0.025_270))]",
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.14] [background-image:linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] [background-size:40px_40px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-[55%] max-w-2xl bg-[radial-gradient(ellipse_at_100%_40%,oklch(0.42_0.1_285_/_0.12),transparent_62%)] blur-2xl"
        aria-hidden
      />
      <LandingReveal className={cn(landingRailSection, "relative")}>
        <p className={landingEyebrow}>Why Orakly</p>
        <h2 className={landingH2Editorial}>
          Built for <span className="font-semibold text-foreground">attention markets</span> — not generic catalogs
        </h2>
        <p className={landingLeadMuted}>
          Same YES / NO mechanics you already understand — listings, flow, and settlement vocabulary tuned for crypto narrative
          speed.
        </p>

        <div className="mt-8 grid overflow-hidden rounded-2xl ring-1 ring-violet-500/15 md:grid-cols-2">
          <div className="border-b border-white/[0.06] bg-zinc-950/50 p-5 backdrop-blur-sm md:border-b-0 md:border-r md:border-white/[0.07] md:p-6">
            <p className={landingEyebrow}>Traditional platforms</p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Static catalogs and UI meant for occasional political bets — not intraday narrative traders.
            </p>
          </div>
          <div className="relative bg-[linear-gradient(165deg,oklch(0.22_0.08_145_/_0.12),transparent_65%)] p-5 md:p-6">
            <div className="pointer-events-none absolute inset-y-0 left-0 w-px bg-gradient-to-b from-emerald-400/50 via-yes/20 to-transparent" aria-hidden />
            <p className={landingEyebrowAccent}>Orakly</p>
            <p className="mt-3 text-sm font-medium text-foreground">Purpose-built for:</p>
            <ul className="mt-3 space-y-2.5">
              {whyOraklyFeatures.map((row) => (
                <li key={row.title} className="text-sm leading-relaxed text-muted-foreground">
                  <span className="font-medium text-foreground">{row.title}</span>
                  <span> — {row.detail}</span>
                </li>
              ))}
            </ul>
            <p className="mt-5 text-sm font-semibold text-yes">Built for velocity — not weekend-only political slips.</p>
          </div>
        </div>

        <div className="mt-6 grid gap-px overflow-hidden rounded-2xl bg-white/[0.06] ring-1 ring-white/[0.06] sm:grid-cols-2">
          {whyOraklyBridgeColumns.map((col) => (
            <div key={col.title} className="bg-[color-mix(in_oklch,hsl(var(--background))_92%,var(--card)_8%)] px-4 py-4 sm:px-5 sm:py-5">
              <p className={landingEyebrowAccent}>{col.title}</p>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
                {col.lines.map((line) => (
                  <li key={line} className="flex gap-2.5">
                    <span className="mt-2 size-1 shrink-0 rounded-full bg-yes/70" aria-hidden />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </LandingReveal>
    </section>
  );
}

const communityCellIcons = [Megaphone, Users, Trophy, TrendingUp] as const;

export function MarketingLandingCommunity() {
  return (
    <section
      id="community"
      className={cn(
        "relative w-full scroll-mt-28 overflow-hidden",
        "bg-[radial-gradient(ellipse_90%_70%_at_10%_0%,oklch(0.38_0.08_15_/_0.14),transparent_55%),linear-gradient(120deg,oklch(0.14_0.02_25),hsl(var(--background))_45%,oklch(0.12_0.018_35))]",
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.28] [background-image:radial-gradient(circle_at_1px_1px,rgba(255,220,200,0.04)_1px,transparent_0)] [background-size:20px_20px]"
        aria-hidden
      />
      <LandingReveal className={cn(landingRailSection, "relative")}>
        <div className="flex flex-wrap gap-x-10 gap-y-4 pb-6">
          {communityStats.map((s) => (
            <div key={s.label}>
              <p className="font-display text-xl font-bold tabular-nums text-foreground sm:text-2xl">{s.value}</p>
              <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
        <div
          className="mb-10 h-px w-full bg-gradient-to-r from-rose-400/20 via-transparent to-orange-400/15"
          aria-hidden
        />
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-start">
          <div className="min-w-0 text-left">
            <p className={cn(landingEyebrowAccent, "text-rose-200/80")}>Community</p>
            <h2 className={cn(landingH2, "font-bold tracking-[-0.02em]")}>
              Your conviction shapes what <span className="text-rose-100/95">lists next</span>
            </h2>
            <p className={landingLeadMuted}>
              Markets stay relevant when the crowd proposes, competes, and earns from being early — not when a central editor guesses
              themes.
            </p>
            <p className="mt-4 max-w-[42rem] text-sm font-medium text-foreground/90">Orakly ships features with the community, not only for it.</p>
          </div>
          <div className="grid min-w-0 gap-2.5 sm:grid-cols-2">
            {communityFeatures.map((cell, i) => {
              const Icon = communityCellIcons[i] ?? Users;
              return (
                <div
                  key={cell.verb}
                  className="flex gap-3 rounded-xl border border-rose-500/10 bg-rose-950/[0.15] px-3.5 py-3 backdrop-blur-md transition hover:border-rose-400/25 hover:shadow-[0_20px_48px_-32px_rgba(251,113,133,0.12)]"
                >
                  <Icon className="mt-0.5 size-4 shrink-0 text-rose-300/90" aria-hidden />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{cell.verb}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{cell.detail}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </LandingReveal>
    </section>
  );
}

export function MarketingLandingSecurity() {
  return (
    <section
      id="security"
      className={cn(
        "relative w-full scroll-mt-28 overflow-hidden",
        "bg-[linear-gradient(185deg,oklch(0.09_0.02_260)_0%,oklch(0.075_0.018_265)_100%)]",
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_100%_60%_at_50%_0%,oklch(0.35_0.08_200_/_0.1),transparent_58%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-0 left-1/2 h-48 w-[min(90%,48rem)] -translate-x-1/2 bg-[radial-gradient(ellipse_at_50%_100%,oklch(0.4_0.06_195_/_0.08),transparent_70%)]"
        aria-hidden
      />
      <LandingReveal className={cn(landingRailSection, "relative")}>
        <p className={cn(landingEyebrow, "text-cyan-200/55")}>Security · audit surface</p>
        <h2 className={cn(landingH2Ultra, "!mt-2 text-balance")}>Trust starts with readable rules</h2>
        <p className={landingLeadMuted}>
          No black-box payouts — settlement paths and collateral expectations stay explicit before capital hits.
        </p>
        <div className="mt-8 rounded-2xl border border-cyan-500/10 bg-[linear-gradient(165deg,oklch(0.12_0.03_260),oklch(0.08_0.02_265))] p-5 shadow-[0_0_0_1px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(34,211,238,0.06)] backdrop-blur-xl sm:p-6">
          <ul className="grid gap-2.5 sm:grid-cols-2">
            {securityItems.map((item) => (
              <li
                key={item.title}
                className="flex gap-3 rounded-xl border border-cyan-500/10 bg-cyan-950/[0.2] px-3.5 py-3 transition hover:border-cyan-400/25"
              >
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border border-cyan-400/35 bg-cyan-400/10 text-[10px] font-bold text-cyan-200">
                  ✓
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{item.title}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-5 border-t border-transparent pt-4">
            <div
              className="mb-4 h-px w-full bg-gradient-to-r from-transparent via-cyan-400/15 to-transparent"
              aria-hidden
            />
            <p className="font-mono text-[11px] text-cyan-200/45">Designed for clarity, trust, and verifiable outcomes.</p>
          </div>
        </div>
      </LandingReveal>
    </section>
  );
}

export function MarketingLandingFuture() {
  return (
    <section
      id="future"
      className={cn(
        "relative w-full scroll-mt-28 overflow-hidden",
        "bg-[radial-gradient(ellipse_90%_70%_at_0%_0%,oklch(0.28_0.1_270_/_0.25),transparent_55%),linear-gradient(188deg,oklch(0.11_0.04_270),hsl(var(--background))_40%,oklch(0.1_0.035_275))]",
      )}
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute inset-y-0 right-0 w-[min(50vw,540px)] opacity-[0.07]">
          <div className="relative h-full min-h-[220px] w-full">
            <Image
              src={LANDING_IMAGES.background}
              alt=""
              fill
              sizes="(max-width: 1024px) 0px, 540px"
              className="object-cover object-[82%_center]"
            />
          </div>
        </div>
      </div>
      <LandingReveal className={cn(landingRailSection, "relative")}>
        <p className={landingEyebrow}>Future vision</p>
        <h2 className={cn(landingH2, "font-medium tracking-[-0.01em] text-foreground/90")}>
          Roadmap: <span className="text-sky-300/95">single markets</span> → narrative stack
        </h2>
        <p className={landingLead}>
          Indexes, social layers, and analytics on the same transparent core — expansion without opaque side products.
        </p>
        <p className="mt-4 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Themes in flight</p>
        <ul className="relative mt-5 space-y-2.5 border-l border-blue-400/25 pl-5 sm:pl-6">
          {futureRoadmap.map((item) => (
            <li key={item.title} className="relative pl-1">
              <span
                className="absolute -left-[calc(1.25rem+5px)] top-2.5 size-2 rounded-full bg-blue-400 shadow-[0_0_14px_rgba(96,165,250,0.55)] ring-2 ring-background"
                aria-hidden
              />
              <article className="rounded-xl border border-white/[0.06] bg-background/45 px-3.5 py-2.5 backdrop-blur-sm sm:px-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold leading-tight text-foreground">{item.title}</h3>
                  <span
                    className={cn(
                      "shrink-0 rounded-md px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide",
                      item.phase === "Next" ? "bg-blue-500/25 text-blue-200" : "bg-muted/40 text-muted-foreground",
                    )}
                  >
                    {item.phase}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.body}</p>
              </article>
            </li>
          ))}
        </ul>
      </LandingReveal>
    </section>
  );
}

export function MarketingLandingEarlyAccess() {
  return (
    <section
      id="early-access"
      className={cn(
        "relative w-full scroll-mt-28 overflow-hidden",
        "bg-[radial-gradient(ellipse_80%_60%_at_50%_100%,oklch(0.3_0.1_285_/_0.12),transparent_58%),linear-gradient(185deg,hsl(var(--background)),oklch(0.12_0.025_280))]",
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.2] mix-blend-overlay [background-image:radial-gradient(circle_at_1px_1px,rgba(167,139,250,0.06)_1px,transparent_0)] [background-size:22px_22px]"
        aria-hidden
      />
      <LandingReveal className={cn(landingRailSection)}>
        <div className="w-full rounded-2xl border border-violet-400/15 bg-gradient-to-b from-violet-950/25 via-background/50 to-background/30 p-5 shadow-[inset_0_1px_0_rgba(167,139,250,0.12),0_32px_64px_-40px_rgba(0,0,0,0.75)] backdrop-blur-xl sm:p-7">
          <p className={cn(landingEyebrow, "text-violet-200/70")}>Early access</p>
          <h2 className={cn(landingH2Ultra, "!mt-2")}>Join the waitlist</h2>
          <p className={landingLeadMuted}>Beta slots and product updates — no spam.</p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="min-w-0 flex-1">
              <span className="sr-only">Email</span>
              <input
                type="email"
                autoComplete="email"
                placeholder="you@domain.com"
                className="w-full rounded-xl border border-white/[0.1] bg-black/30 px-3.5 py-2.5 text-sm text-foreground outline-none ring-0 placeholder:text-muted-foreground focus:border-yes/45 focus:outline-none focus:ring-2 focus:ring-yes/30"
              />
            </label>
            <a
              href="#footer"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yes focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Join waitlist
            </a>
          </div>
          <div className="mt-6 border-t border-white/[0.06] pt-6">
            <p className={landingEyebrow}>You will get to</p>
            <ul className="mt-3 space-y-2">
              {earlyAccessBullets.map((b) => (
                <li key={b.title} className="flex gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-yes" strokeWidth={1.35} aria-hidden />
                  <span>
                    <span className="font-medium text-foreground">{b.title}</span>
                    <span> — {b.body}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </LandingReveal>
    </section>
  );
}
