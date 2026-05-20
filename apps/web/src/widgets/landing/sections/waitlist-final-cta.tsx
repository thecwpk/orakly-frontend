import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { ROUTES } from "@/shared/constants/routes";
import { cn } from "@/lib/utils";
import { WaitlistForm } from "@/widgets/landing/sections/waitlist-form";
import {
  landingEyebrow,
  landingH2,
  landingLead,
  landingBandInner,
  landingSectionBand,
} from "@/widgets/landing/sections/marketing-landing-rail";
import { LandingReveal } from "@/widgets/landing/sections/marketing-landing-layout";

/**
 * Single closing surface — merges v1 `early-access` + `final-cta` sections.
 * Visitor sees the real form first, with the secondary "Launch app" link
 * for those ready to skip the queue.
 */
export function WaitlistFinalCta() {
  return (
    <section
      id="early-access"
      className={cn(
        landingSectionBand,
        "bg-[radial-gradient(ellipse_100%_90%_at_50%_-25%,oklch(0.42_0.16_285_/_0.35),transparent_55%),radial-gradient(ellipse_55%_45%_at_0%_100%,oklch(0.32_0.12_270_/_0.22),transparent_60%),linear-gradient(188deg,oklch(0.1_0.03_275),hsl(var(--background))_45%,oklch(0.09_0.025_280))]",
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_80%_20%,oklch(0.5_0.08_220_/_0.08),transparent_65%)]"
        aria-hidden
      />
      <LandingReveal className={cn(landingBandInner, "relative")}>
        <div className="mx-auto max-w-2xl text-center">
          <p className={landingEyebrow}>Updates</p>
          <h2 className={cn(landingH2, "mt-3")}>Stay close to what ships next.</h2>
          <p className={cn(landingLead, "mx-auto")}>
            Add your email for product announcements and roadmap notes. We send only when there is something worth
            reading.
          </p>
        </div>

        <div className="mx-auto mt-8 w-full max-w-xl rounded-2xl border border-white/[0.08] bg-background/40 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_32px_64px_-40px_rgba(0,0,0,0.7)] backdrop-blur-xl sm:p-6">
          <WaitlistForm source="landing-final-cta" />
        </div>

        <div className="mx-auto mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
          <span>Already in?</span>
          <Link
            href={ROUTES.dapp}
            className="inline-flex items-center gap-1.5 font-semibold text-foreground hover:text-yes focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yes/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Launch app
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </LandingReveal>
    </section>
  );
}
