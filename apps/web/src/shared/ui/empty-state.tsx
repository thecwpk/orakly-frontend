import type { ComponentType, ReactNode, SVGProps } from "react";
import { cn } from "@/lib/utils";

/**
 * Premium empty state — used whenever a list / panel has no data yet
 * (no positions, no trades, no notifications, etc.).
 *
 * Matches the Stripe / Linear / Vercel pattern:
 *   - centered icon ring
 *   - balanced title + sub-description
 *   - exactly one primary action (or two action buttons stacked)
 *   - flat panel surface, no animations on mount (to keep it quiet)
 */

type Tone = "default" | "accent" | "success" | "warn" | "danger";
const TONE_SURFACE: Record<Tone, string> = {
  default: "bg-black/35 ring-white/[0.06]",
  accent: "bg-cyan-950/25 ring-cyan-500/22",
  success: "bg-emerald-950/20 ring-emerald-500/22",
  warn: "bg-amber-950/15 ring-amber-500/22",
  danger: "bg-rose-950/20 ring-rose-500/22",
};
const TONE_ICON: Record<Tone, string> = {
  default: "text-zinc-400 ring-white/[0.06]",
  accent: "text-cyan-300 ring-cyan-400/25",
  success: "text-emerald-300 ring-emerald-400/25",
  warn: "text-amber-300 ring-amber-400/25",
  danger: "text-rose-300 ring-rose-400/25",
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  tone = "default",
  align = "center",
  size = "md",
  className,
}: {
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  title: ReactNode;
  description?: ReactNode;
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
  tone?: Tone;
  align?: "start" | "center";
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeCls =
    size === "lg"
      ? "px-5 py-8 sm:py-10"
      : size === "sm"
        ? "px-4 py-5 sm:py-6"
        : "px-4 py-7 sm:py-8";
  const alignCls = align === "start" ? "items-start text-left" : "items-center text-center";
  return (
    <div
      role="status"
      className={cn(
        "relative flex flex-col gap-3 overflow-hidden rounded-xl ring-1",
        TONE_SURFACE[tone],
        sizeCls,
        alignCls,
        className,
      )}
    >
      {Icon ? (
        <div
          className={cn(
            "inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-black/30 ring-1",
            TONE_ICON[tone],
          )}
          aria-hidden
        >
          <Icon className="h-5 w-5" />
        </div>
      ) : null}

      <div className={cn("max-w-md space-y-1.5", align === "center" && "mx-auto")}>
        <h3 className="text-[15px] font-semibold tracking-tight text-zinc-50">
          {title}
        </h3>
        {description ? (
          <p className="text-pretty text-[13px] leading-[1.55] text-zinc-400">
            {description}
          </p>
        ) : null}
      </div>

      {primaryAction || secondaryAction ? (
        <div
          className={cn(
            "flex flex-wrap items-center gap-2",
            align === "center" && "justify-center",
          )}
        >
          {primaryAction}
          {secondaryAction}
        </div>
      ) : null}
    </div>
  );
}
