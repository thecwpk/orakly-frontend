"use client";

import { Sparkles, TimerReset } from "lucide-react";

import { cn } from "@/lib/utils";
import { howSteps } from "@/widgets/landing/sections/marketing-landing-content";
import { LandingReveal } from "@/widgets/landing/sections/marketing-landing-layout";
import {
  landingBandInner,
  landingEyebrow,
  landingH2,
  landingLead,
  landingSectionBand,
} from "@/widgets/landing/sections/marketing-landing-rail";

/**
 * Three-step loop with live cycle animation — headline stays "Three steps. No magic."
 * Side cards carry the detail; center ring shows the real-time loop.
 */
export function HowItWorksAnimated() {
  return (
    <section
      id="how-it-works"
      className={cn(
        landingSectionBand,
        "bg-[linear-gradient(185deg,oklch(0.14_0.02_255)_0%,var(--background)_38%,oklch(0.13_0.018_250)_100%)]",
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:32px_32px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/20 to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"
        aria-hidden
      />
      <LandingReveal className={landingBandInner}>
        <div className="mb-8 flex w-full min-w-0 flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <Sparkles className="size-4 shrink-0 text-indigo-400/90" aria-hidden />
            <p className={landingEyebrow}>How it works</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/[0.06] px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-wide text-indigo-200/80 backdrop-blur-sm">
            <TimerReset className="size-3.5 text-indigo-300" aria-hidden />
            Live cycle
          </span>
        </div>
        <h2 className={landingH2}>Three steps. No magic.</h2>
        <p className={landingLead}>
          Discover, trade, and settle on-chain. The loop runs live in the center while you read the detail.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(240px,1fr)_minmax(280px,460px)_minmax(240px,1fr)] lg:items-center lg:gap-6">
          <div className="space-y-3">
            <StepCard step={howSteps[0]} />
          </div>
          <CycleDiagram />
          <div className="space-y-3">
            <StepCard step={howSteps[1]} />
            <StepCard step={howSteps[2]} />
          </div>
        </div>
      </LandingReveal>
    </section>
  );
}

function StepCard({ step }: { step: (typeof howSteps)[number] }) {
  return (
    <article className="hw-step rounded-2xl border border-white/[0.1] bg-white/[0.035] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.07)] backdrop-blur-xl transition hover:border-indigo-400/30 hover:bg-white/[0.055]">
      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {step.tag}
      </p>
      <h3 className="mt-1.5 text-sm font-semibold text-foreground">{step.title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
    </article>
  );
}

function CycleDiagram() {
  return (
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
      {howSteps.map((s, i) => (
        <div key={s.n} className={cn("hw-node", `hw-node-${i}`)}>
          <span className="hw-node-dot" aria-hidden />
          <span className="hw-node-label">
            <strong>Step {s.n}</strong>
            <span>{s.title}</span>
          </span>
        </div>
      ))}
    </div>
  );
}
