import { ArrowRight, Compass, Scale, ShieldCheck } from "lucide-react";

import { cn } from "@/lib/utils";
import { howSteps } from "@/widgets/landing/sections/marketing-landing-content";
import {
  landingBody,
  landingEyebrow,
  landingH2,
  landingH3,
  landingLead,
  landingRailSection,
} from "@/widgets/landing/sections/marketing-landing-rail";

/**
 * Replaces the v1 trio inside How-It-Works (Live cycle + 4 steps + Orakly loop)
 * with one linear 3-step row. The earlier section presented the same workflow
 * three different ways, which read like indecision.
 */

const ICONS = [Compass, Scale, ShieldCheck] as const;

export function HowItWorksSimple() {
  return (
    <section
      id="how-it-works"
      className={cn(
        "relative w-full scroll-mt-28 overflow-hidden",
        "bg-[linear-gradient(180deg,hsl(var(--background))_0%,oklch(0.13_0.02_265)_50%,hsl(var(--background))_100%)]",
      )}
    >
      <div className={cn(landingRailSection, "relative")}>
        <p className={landingEyebrow}>How it works</p>
        <h2 className={landingH2}>Three steps. No magic.</h2>
        <p className={landingLead}>
          Discover, trade, and settle on-chain. The full loop fits in one screen.
        </p>

        <ol className="mt-10 grid gap-4 sm:gap-6 md:grid-cols-3">
          {howSteps.map((step, i) => {
            const Icon = ICONS[i] ?? Compass;
            return (
              <li
                key={step.n}
                className="relative flex flex-col rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 backdrop-blur-sm transition hover:border-yes/30 sm:p-6"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Step {step.n}
                  </span>
                  <span className="inline-flex size-9 items-center justify-center rounded-xl border border-white/[0.08] bg-background/50 text-yes">
                    <Icon className="size-4.5" aria-hidden />
                  </span>
                </div>
                <h3 className={cn(landingH3, "mt-5")}>{step.title}</h3>
                <p className={cn(landingBody, "mt-2")}>{step.body}</p>
                {i < howSteps.length - 1 ? (
                  <ArrowRight
                    aria-hidden
                    className="absolute -right-3 top-1/2 hidden size-5 -translate-y-1/2 text-muted-foreground md:block"
                  />
                ) : null}
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
