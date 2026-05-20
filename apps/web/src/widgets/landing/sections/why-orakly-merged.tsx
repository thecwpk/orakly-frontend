"use client";

import { BarChart3, Gauge, LineChart } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  oraklyFramework,
  tradeBandMetrics,
  whyOraklyBridgeColumns,
  whyOraklyFeatures,
} from "@/widgets/landing/sections/marketing-landing-content";
import { LandingReveal } from "@/widgets/landing/sections/marketing-landing-layout";
import { WhyTraditionalVisual } from "@/widgets/landing/sections/why-traditional-visual";
import {
  landingBandInner,
  landingEyebrow,
  landingEyebrowAccent,
  landingH2,
  landingLead,
  landingSectionBand,
} from "@/widgets/landing/sections/marketing-landing-rail";

const metricIcons = [BarChart3, Gauge, LineChart] as const;

/**
 * Rich Why Orakly — traditional vs Orakly comparison, bridge columns,
 * animated metric band, and framework grid. Restores v1 depth without
 * repeating the same three bullets elsewhere.
 */
export function WhyOraklyMerged() {
  return (
    <section
      id="why"
      className={cn(
        landingSectionBand,
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
      <LandingReveal className={landingBandInner}>
        <p className={landingEyebrow}>Why Orakly</p>
        <h2 className={landingH2}>
          Built for <span className="text-violet-200/95">crypto-native questions</span> — not generic catalogs
        </h2>
        <p className={landingLead}>
          Same YES / NO mechanics you already understand — listings, flow, and settlement tuned for traders who move fast.
        </p>

        <div className="mt-8 grid min-h-[320px] overflow-hidden rounded-2xl ring-1 ring-violet-500/15 md:min-h-[380px] md:grid-cols-2">
          <WhyTraditionalVisual />
          <OraklyPanel />
        </div>

        <div className="mt-6 grid gap-px overflow-hidden rounded-2xl bg-white/[0.06] ring-1 ring-white/[0.06] sm:grid-cols-2">
          {whyOraklyBridgeColumns.map((col) => (
            <div
              key={col.title}
              className="bg-[color-mix(in_oklch,hsl(var(--background))_92%,var(--card)_8%)] px-4 py-4 sm:px-5 sm:py-5"
            >
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

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {tradeBandMetrics.map((m, i) => {
            const Icon = metricIcons[i] ?? BarChart3;
            return (
              <div
                key={m.label}
                className="wo-metric-glow group flex min-w-0 flex-1 basis-full gap-3 rounded-xl border border-white/[0.06] bg-background/40 px-4 py-3.5 transition hover:border-yes/25 hover:bg-yes/[0.03] sm:basis-[calc(33.333%-0.5rem)]"
              >
                <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-background/60 text-yes shadow-inner transition group-hover:shadow-[0_0_20px_-4px_color-mix(in_srgb,var(--yes)_35%,transparent)]">
                  <Icon className="size-4" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className={landingEyebrow}>{m.label}</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">{m.headline}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{m.fact}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-10">
          <p className={landingEyebrow}>Orakly framework</p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {oraklyFramework.map((item) => (
              <div
                key={item.k}
                className="rounded-xl border border-transparent bg-gradient-to-b from-white/[0.04] to-transparent px-4 py-4 transition hover:border-yes/15"
              >
                <p className="text-sm font-semibold text-foreground">{item.k}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{item.d}</p>
              </div>
            ))}
          </div>
        </div>
      </LandingReveal>
    </section>
  );
}

function OraklyPanel() {
  return (
    <div className="relative flex min-h-[320px] flex-col bg-[linear-gradient(165deg,oklch(0.22_0.08_145_/_0.12),transparent_65%)] p-5 md:min-h-[380px] md:p-6">
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-px bg-gradient-to-b from-emerald-400/50 via-yes/20 to-transparent"
        aria-hidden
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className={landingEyebrowAccent}>Orakly</p>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-yes/30 bg-yes/10 px-2.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-yes">
          <span className="relative flex size-1.5">
            <span className="motion-safe:animate-ping absolute inline-flex size-full rounded-full bg-yes opacity-50" />
            <span className="relative size-1.5 rounded-full bg-yes" />
          </span>
          Live tape
        </span>
      </div>
      <p className="mt-3 text-sm font-medium text-foreground">Purpose-built for:</p>
      <ul className="mt-3 space-y-2.5">
        {whyOraklyFeatures.map((row) => (
          <li key={row.title} className="text-sm leading-relaxed text-muted-foreground">
            <span className="font-medium text-foreground">{row.title}</span>
            <span> — {row.detail}</span>
          </li>
        ))}
      </ul>
      <p className="mt-5 text-sm font-semibold text-yes">Move with the market — not after the recap.</p>
    </div>
  );
}
