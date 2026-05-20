"use client";

import { Sora } from "next/font/google";

import { cn } from "@/lib/utils";
import { MarketingLandingHero } from "@/widgets/landing/sections/marketing-landing-hero";
import { MarketingLandingKeyframes } from "@/widgets/landing/sections/marketing-landing-keyframes";
import { MarketingLandingSections } from "@/widgets/landing/sections/marketing-landing-sections";

const sora = Sora({
  subsets: ["latin"],
  display: "swap",
  weight: ["500", "600", "700", "800"],
});

/**
 * Active marketing landing — composes Hero + Sections.
 *
 * v1 mounted two fixed full-viewport gradient + dot-pattern layers on top
 * of every section's own background. They're removed; each section now
 * owns its own canvas, which is both lighter and easier to debug.
 */
export function MarketingLanding() {
  return (
    <div className={cn(sora.className, "relative isolate w-full max-w-none overflow-x-hidden py-0")}>
      <div className="relative z-0 flex w-full flex-col">
        <MarketingLandingHero />
        <MarketingLandingSections />
      </div>
      <MarketingLandingKeyframes />
    </div>
  );
}
