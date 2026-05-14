import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type MarketingSectionTone = "canvas" | "raised" | "deep" | "spotlight";

const toneClass: Record<MarketingSectionTone, string> = {
  canvas: "bg-[var(--bg-0)]",
  raised: "bg-[var(--bg-1)]",
  deep: "bg-[var(--bg-2)]",
  spotlight: "bg-gradient-to-b from-[var(--bg-1)] to-[var(--bg-2)]",
};

export function MarketingSection({
  id,
  "aria-labelledby": ariaLabelledBy,
  tone,
  showTopAccent = true,
  scrollAnchor = false,
  glowOrb = false,
  className,
  children,
}: {
  id?: string;
  "aria-labelledby"?: string;
  tone: MarketingSectionTone;
  showTopAccent?: boolean;
  scrollAnchor?: boolean;
  glowOrb?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={ariaLabelledBy}
      className={cn(
        "relative z-[1] my-0 overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]",
        toneClass[tone],
        scrollAnchor && "scroll-mt-[4.5rem]",
        showTopAccent &&
          "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:z-[2] before:h-px before:bg-gradient-to-r before:from-transparent before:via-[var(--accent-soft)]/25 before:to-transparent before:content-['']",
        className,
      )}
    >
      {glowOrb ? (
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[min(92vw,560px)] w-[min(92vw,560px)] -translate-x-1/2 -translate-y-[42%] rounded-full bg-[var(--accent-dim)]/12 blur-3xl"
          aria-hidden
        />
      ) : null}
      {children}
    </section>
  );
}

const padX = "px-[var(--space-4)] sm:px-[var(--space-6)] lg:px-[var(--space-7)]";
const padYDefault = "py-[var(--space-6)] sm:py-[var(--space-7)]";
const padYComfortable = "py-[var(--space-7)] sm:py-20 lg:py-24";

/** Primary section label — use on `<p>` above each section H2 for consistent scan line. */
export const marketingSectionEyebrowClass =
  "font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--accent-soft)]";

export function MarketingSectionInner({
  density = "default",
  maxWidthClass = "max-w-7xl",
  className,
  children,
}: {
  density?: "default" | "comfortable";
  maxWidthClass?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "relative z-[1] mx-auto w-full",
        maxWidthClass,
        padX,
        density === "comfortable" ? padYComfortable : padYDefault,
        className,
      )}
    >
      {children}
    </div>
  );
}
