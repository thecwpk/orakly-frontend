import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Eyebrow, Subheading, Caption } from "./typography";

/**
 * Canonical section heading used across the app: an *eyebrow* (uppercase
 * meta), a *title* (Subheading), an optional *description* (Caption), and an
 * `actions` slot pinned to the right.
 *
 * Replaces the ad-hoc `<h2 className="text-[10px] uppercase …">SECTION</h2>`
 * pattern repeated across portfolio / wallet / leaderboard pages — gives
 * consistent vertical rhythm and a single place to evolve the visual.
 */
export type SectionHeaderProps = {
  eyebrow?: ReactNode;
  /** Tone for the eyebrow chip (defaults to muted). */
  eyebrowTone?: "muted" | "accent" | "success" | "danger";
  /** Required label-style title. */
  title: ReactNode;
  /** Optional one-liner under the title. */
  description?: ReactNode;
  /** Right-side slot (filters, buttons, "view all" links). */
  actions?: ReactNode;
  /** Variant: dense (default) for repeated section labels in dashboards;
   *  marquee gives a larger title for landing-style hero sections. */
  variant?: "dense" | "marquee";
  className?: string;
  /** When true, renders a thin gradient hairline below — see `<Hairline>`. */
  withHairline?: boolean;
};

export function SectionHeader({
  eyebrow,
  eyebrowTone = "muted",
  title,
  description,
  actions,
  variant = "dense",
  className,
  withHairline = false,
}: SectionHeaderProps) {
  const isDense = variant === "dense";
  return (
    <header
      className={cn(
        "flex flex-col gap-r8",
        "sm:flex-row sm:items-end sm:justify-between sm:gap-r16",
        isDense ? "mb-r8" : "mb-r16 sm:mb-s40",
        withHairline && "border-b border-app-subtle pb-r16",
        className,
      )}
    >
      <div className="min-w-0 space-y-r4">
        {eyebrow ? (
          <Eyebrow
            tone={eyebrowTone}
            className={cn(isDense ? "text-zinc-600" : undefined)}
          >
            {eyebrow}
          </Eyebrow>
        ) : null}

        {isDense ? (
          <Subheading className="text-[13.5px] font-medium tracking-tight text-zinc-200 sm:text-[14px]">
            {title}
          </Subheading>
        ) : (
          <h2 className="text-balance text-xl font-semibold leading-tight tracking-[-0.014em] text-zinc-50 sm:text-[1.6rem]">
            {title}
          </h2>
        )}

        {description ? (
          <Caption className="text-pretty">{description}</Caption>
        ) : null}
      </div>

      {actions ? (
        <div className="flex shrink-0 items-center gap-r8">{actions}</div>
      ) : null}
    </header>
  );
}

/**
 * Page-level header. Renders breadcrumbs / eyebrow, the page title, an
 * optional description, and a right-side actions slot — consistent across
 * /portfolio, /wallet, /leaderboard, /admin etc. so users always orient the
 * same way.
 */
export type PageHeaderProps = {
  eyebrow?: ReactNode;
  eyebrowTone?: "muted" | "accent" | "success" | "danger";
  title: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export function PageHeader({
  eyebrow,
  eyebrowTone = "muted",
  title,
  description,
  meta,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "mb-r24 flex flex-col gap-r8 border-b border-app-subtle pb-r24",
        "sm:mb-s48 sm:flex-row sm:items-end sm:justify-between sm:gap-r16 sm:pb-r24 md:gap-r24",
        className,
      )}
    >
      <div className="min-w-0 space-y-r4 sm:space-y-r8">
        {eyebrow ? <Eyebrow tone={eyebrowTone}>{eyebrow}</Eyebrow> : null}
        <h1 className="text-balance text-lg font-semibold leading-[1.15] tracking-[-0.02em] text-zinc-50 sm:text-xl md:text-[1.3125rem]">
          {title}
        </h1>
        {description ? (
          <p className="max-w-xl font-mono text-[10.5px] leading-relaxed tracking-tight text-zinc-600">
            {description}
          </p>
        ) : null}
        {meta ? (
          <div className="flex flex-wrap items-center gap-r8 pt-r4">{meta}</div>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-r8">
          {actions}
        </div>
      ) : null}
    </header>
  );
}
