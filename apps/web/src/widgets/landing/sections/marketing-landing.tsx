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

export function MarketingLanding() {
  return (
    <div className={cn(sora.className, "relative isolate w-full max-w-none overflow-x-hidden py-0")}>
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-[0.45]"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 90% 50% at 50% -10%, color-mix(in srgb, var(--primary) 8%, transparent), transparent 58%), radial-gradient(ellipse 45% 35% at 100% 35%, color-mix(in srgb, var(--yes) 5%, transparent), transparent 62%)",
        }}
      />
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-[0.28] mix-blend-overlay [background-size:18px_18px] [background-image:radial-gradient(circle_at_center,rgba(255,255,255,0.035)_1px,transparent_1px)]"
        aria-hidden
      />

      <div className="relative z-0 flex w-full flex-col">
        <MarketingLandingHero />
        <MarketingLandingSections />
      </div>

      <MarketingLandingKeyframes />
    </div>
  );
}
