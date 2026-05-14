import { cn } from "@/lib/utils";

/** Canonical horizontal rail — all section copy aligns to this left edge. */
export const landingShell = "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8";

/** Default vertical rhythm between major bands. */
export const landingSectionY = "py-16 sm:py-20 lg:py-24";

/** Hero band: slightly tighter top, generous bottom. */
export const landingHeroY = "pb-20 pt-14 sm:pb-24 sm:pt-16 lg:pb-28 lg:pt-20";

/** @deprecated use landingShell — kept for gradual migration */
export const landingRail = landingShell;

/** Standard section: shell + vertical padding. */
export const landingRailSection = cn(landingShell, landingSectionY);

/** Eyebrow — unified scan line (replaces mixed font-mono variants). */
export const landingEyebrow =
  "font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground";

export const landingEyebrowAccent = cn(landingEyebrow, "text-yes");

export const landingH1 =
  "font-display text-pretty text-[clamp(1.85rem,4vw+1rem,3.35rem)] font-bold leading-[1.08] tracking-[-0.02em] text-foreground";

export const landingH2 =
  "mt-2 font-display text-2xl font-bold tracking-tight text-foreground sm:text-[1.75rem] sm:leading-snug lg:text-3xl";

/** Extra density — terminal / data-forward sections */
export const landingH2Ultra =
  "mt-2 font-display text-2xl font-extrabold tracking-[-0.03em] text-foreground sm:text-[1.85rem] sm:leading-[1.12] lg:text-[2.1rem]";

/** Lighter voice — editorial / positioning copy */
export const landingH2Editorial =
  "mt-3 font-display text-2xl font-light tracking-[-0.01em] text-foreground/95 sm:text-[1.8rem] sm:leading-snug lg:text-[2.35rem]";

/** Accent span inside headings — cyan → sky (readable on dark) */
export const landingTextGradientAccent =
  "bg-gradient-to-r from-cyan-200/95 via-sky-300 to-indigo-300/90 bg-clip-text text-transparent";

/** Spotlight-style headline fragment */
export const landingTextGradientSpotlight =
  "bg-gradient-to-br from-white via-white to-cyan-200/85 bg-clip-text text-transparent";

export const landingH2Lg = "mt-2 font-display text-2xl font-bold tracking-tight text-foreground sm:text-[2.05rem] lg:text-[2.25rem]";

export const landingLead =
  "mt-4 max-w-[42rem] text-[0.9375rem] leading-[1.65] text-foreground/88 sm:text-base sm:leading-relaxed";

export const landingLeadMuted =
  "mt-4 max-w-[42rem] text-sm leading-relaxed text-muted-foreground sm:text-[0.95rem] sm:leading-relaxed";
