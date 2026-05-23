"use client";

import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { ComingSoonButton } from "@/widgets/landing/components/coming-soon-button";

const primaryClass =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-primary to-[color:color-mix(in_srgb,var(--primary)_72%,black)] px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_16px_40px_-14px_color-mix(in_srgb,var(--primary)_70%,transparent)] ring-1 ring-white/10 transition hover:brightness-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yes focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const secondaryClass =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.1] bg-background/35 px-5 py-2.5 text-sm font-semibold text-foreground shadow-sm backdrop-blur-md transition hover:border-yes/35 hover:bg-yes/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yes/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export function MarketingLandingCtas({ className }: { className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 gap-3 sm:flex sm:flex-wrap", className)}>
      <ComingSoonButton className={primaryClass}>
        Launch app
        <ArrowRight className="size-4" aria-hidden />
      </ComingSoonButton>
      <ComingSoonButton className={secondaryClass}>Explore markets</ComingSoonButton>
    </div>
  );
}
