import type { ElementType, HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Canonical type primitives.
 *
 * Every page should use these instead of raw `<h1>` / `<p>` with ad-hoc
 * Tailwind classes. The result is a tight, predictable type scale that
 * matches Linear's & Stripe's visual rhythm:
 *
 *   Display   — single hero line per page (landing-only)
 *   Heading   — page / dialog titles                ($ size 1: 2xl/3xl)
 *   Subheading — section titles                     ($ size 2: lg)
 *   Eyebrow   — uppercased meta label, tracked      ($ size 0: 10–11px)
 *   Body      — main paragraph copy                 (14–15px / 1.55)
 *   Caption   — annotations, metadata               (11–12px)
 *
 * All variants accept `as` so callers can pick the correct semantic tag
 * (`<Heading as="h1">` → renders an `<h1>` styled like a heading).
 */

type BaseProps<E extends ElementType> = {
  as?: E;
  className?: string;
  children?: ReactNode;
} & Omit<HTMLAttributes<HTMLElement>, "className" | "children">;

export function Display({
  as,
  className,
  children,
  ...rest
}: BaseProps<ElementType>) {
  const Component: ElementType = as ?? "h1";
  return (
    <Component
      className={cn(
        "text-balance font-semibold leading-[1.05] tracking-[-0.02em]",
        "text-[clamp(2.25rem,4.5vw,3.75rem)]",
        className,
      )}
      {...rest}
    >
      {children}
    </Component>
  );
}

export function Heading({
  as,
  level = 1,
  className,
  children,
  ...rest
}: BaseProps<ElementType> & { level?: 1 | 2 | 3 }) {
  const Component: ElementType =
    as ?? (level === 1 ? "h1" : level === 2 ? "h2" : "h3");
  const sizeCls =
    level === 1
      ? "text-2xl sm:text-[1.625rem] tracking-[-0.018em]"
      : level === 2
        ? "text-lg sm:text-xl tracking-[-0.012em]"
        : "text-base sm:text-[1.0625rem] tracking-[-0.008em]";
  return (
    <Component
      className={cn(
        "font-semibold text-zinc-50 leading-tight text-balance",
        sizeCls,
        className,
      )}
      {...rest}
    >
      {children}
    </Component>
  );
}

export function Subheading({
  as,
  className,
  children,
  ...rest
}: BaseProps<ElementType>) {
  const Component: ElementType = as ?? "h2";
  return (
    <Component
      className={cn(
        "text-[15px] font-semibold leading-snug tracking-tight text-zinc-100",
        className,
      )}
      {...rest}
    >
      {children}
    </Component>
  );
}

export function Eyebrow({
  as,
  tone = "muted",
  className,
  children,
  ...rest
}: BaseProps<ElementType> & {
  tone?: "muted" | "accent" | "success" | "danger";
}) {
  const Component: ElementType = as ?? "span";
  const toneCls =
    tone === "accent"
      ? "text-cyan-300/90"
      : tone === "success"
        ? "text-emerald-300/90"
        : tone === "danger"
          ? "text-rose-300/90"
          : "text-zinc-500";
  return (
    <Component
      className={cn(
        "block font-mono text-[9px] font-medium uppercase tracking-[0.14em]",
        toneCls,
        className,
      )}
      {...rest}
    >
      {children}
    </Component>
  );
}

export function Body({
  as,
  size = "md",
  tone = "default",
  className,
  children,
  ...rest
}: BaseProps<ElementType> & {
  size?: "sm" | "md" | "lg";
  tone?: "default" | "muted" | "subtle";
}) {
  const Component: ElementType = as ?? "p";
  const sizeCls =
    size === "lg"
      ? "text-[15.5px] leading-[1.55]"
      : size === "sm"
        ? "text-[12.5px] leading-[1.5]"
        : "text-[13.5px] leading-[1.55]";
  const toneCls =
    tone === "muted"
      ? "text-zinc-400"
      : tone === "subtle"
        ? "text-zinc-500"
        : "text-zinc-200";
  return (
    <Component
      className={cn("text-pretty", sizeCls, toneCls, className)}
      {...rest}
    >
      {children}
    </Component>
  );
}

export function Caption({
  as,
  className,
  children,
  ...rest
}: BaseProps<ElementType>) {
  const Component: ElementType = as ?? "p";
  return (
    <Component
      className={cn("text-[11px] leading-[1.45] text-zinc-500", className)}
      {...rest}
    >
      {children}
    </Component>
  );
}

/**
 * Mono-numeric value rendering. Use everywhere a *price*, *probability*, or
 * *quantity* is shown — guarantees `tabular-nums` so values don't shift width.
 */
export function NumValue({
  as,
  size = "md",
  tone = "default",
  className,
  children,
  ...rest
}: BaseProps<ElementType> & {
  size?: "sm" | "md" | "lg" | "xl";
  tone?: "default" | "muted" | "success" | "danger" | "accent";
}) {
  const Component: ElementType = as ?? "span";
  const sizeCls =
    size === "xl"
      ? "text-2xl"
      : size === "lg"
        ? "text-lg"
        : size === "sm"
          ? "text-[12px]"
          : "text-[13.5px]";
  const toneCls =
    tone === "success"
      ? "text-emerald-200"
      : tone === "danger"
        ? "text-rose-200"
        : tone === "accent"
          ? "text-cyan-200"
          : tone === "muted"
            ? "text-zinc-400"
            : "text-zinc-100";
  return (
    <Component
      className={cn(
        "font-mono font-semibold tabular-nums tracking-tight",
        sizeCls,
        toneCls,
        className,
      )}
      {...rest}
    >
      {children}
    </Component>
  );
}
