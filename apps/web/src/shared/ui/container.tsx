import type { ElementType, HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Polymorphic layout primitives — horizontal gutters use **group** rhythm
 * Horizontal inset comes from the shell (`appMainPageInsetStyle` on `<main>`);
 * this component only constrains **max-width** and centers. Full-bleed rows can
 * use `appStickyToolbarBleedStyle` (see `page-layout.ts`).
 */

type Width = "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "fluid";

/**
 * Width tier maps to a sensible visual reading width *and* clamps content from
 * stretching to absurd lengths on ultra-wide monitors. Use:
 *   - `sm` for forms / focused single-column content.
 *   - `md` for marketing-style narrative pages.
 *   - `lg` (default) for standard app pages and dashboards.
 *   - `xl` for trading-grid pages with 3+ columns.
 *   - `2xl` / `3xl` for ultra-wide trading workstations.
 *   - `fluid` for full-bleed surfaces (no max width — use sparingly).
 */
const WIDTH_MAP: Record<Width, string> = {
  sm: "max-w-3xl",
  md: "max-w-5xl",
  lg: "max-w-6xl",
  xl: "max-w-7xl",
  "2xl": "max-w-screen-2xl",
  "3xl": "max-w-screen-3xl",
  fluid: "max-w-none",
};

type ContainerProps = {
  width?: Width;
  as?: ElementType;
  className?: string;
  children?: ReactNode;
} & Omit<HTMLAttributes<HTMLElement>, "className">;

export function Container({
  width = "lg",
  as,
  className,
  children,
  ...rest
}: ContainerProps) {
  const Component: ElementType = as ?? "div";
  return (
    <Component
      className={cn(
        "mx-auto w-full",
        WIDTH_MAP[width],
        "px-0",
        className,
      )}
      {...rest}
    >
      {children}
    </Component>
  );
}

type SectionProps = {
  /** Vertical rhythm preset. */
  spacing?: "tight" | "default" | "loose";
  width?: Width;
  as?: ElementType;
  className?: string;
  children?: ReactNode;
} & Omit<HTMLAttributes<HTMLElement>, "className">;

const SPACING_MAP = {
  /** Inset bands — upper end of **group** scale (still sub-section). */
  tight: "py-r24 md:py-s40",
  /** Standard page vertical padding — **section** scale opens up by breakpoint. */
  default: "py-s40 md:py-s48 lg:py-s56",
  /** Hero / marketing — strongest **section** separation. */
  loose: "py-s56 md:py-s64 lg:py-s72",
} as const;

export function Section({
  spacing = "default",
  width = "lg",
  as,
  className,
  children,
  ...rest
}: SectionProps) {
  const Component: ElementType = as ?? "section";
  return (
    <Component className={cn(SPACING_MAP[spacing], className)} {...rest}>
      <Container width={width}>
        {children}
      </Container>
    </Component>
  );
}

type StackProps = {
  gap?: "xs" | "sm" | "md" | "lg" | "xl";
  as?: ElementType;
  className?: string;
  children?: ReactNode;
};

const GAP_MAP = {
  xs: "gap-r4",
  sm: "gap-r8",
  md: "gap-r16",
  lg: "gap-r20",
  xl: "gap-r24",
} as const;

export function Stack({
  gap = "md",
  as,
  className,
  children,
}: StackProps) {
  const Component: ElementType = as ?? "div";
  return (
    <Component className={cn("flex flex-col", GAP_MAP[gap], className)}>
      {children}
    </Component>
  );
}

type ClusterProps = StackProps & {
  align?: "start" | "center" | "end" | "baseline";
  justify?: "start" | "center" | "end" | "between" | "around";
  wrap?: boolean;
};

const ALIGN_MAP = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  baseline: "items-baseline",
} as const;

const JUSTIFY_MAP = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
  around: "justify-around",
} as const;

export function Cluster({
  gap = "sm",
  align = "center",
  justify = "start",
  wrap = true,
  as,
  className,
  children,
}: ClusterProps) {
  const Component: ElementType = as ?? "div";
  return (
    <Component
      className={cn(
        "flex",
        wrap && "flex-wrap",
        GAP_MAP[gap],
        ALIGN_MAP[align],
        JUSTIFY_MAP[justify],
        className,
      )}
    >
      {children}
    </Component>
  );
}
