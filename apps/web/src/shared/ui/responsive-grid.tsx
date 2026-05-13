import type { ElementType, HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Declarative responsive grid primitive.
 *
 * Replaces ad-hoc `grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 …` strings
 * scattered across widgets — pass column counts per breakpoint, get a properly
 * typed grid back. Tailwind needs *literal* class names to be statically
 * detectable, so this component maps numeric props → a hand-coded class table
 * rather than `grid-cols-${n}` template literals.
 *
 * Usage:
 *   <ResponsiveGrid cols={{ base: 1, sm: 2, lg: 3, "2xl": 4, "3xl": 5 }} gap="lg">
 *     {cards}
 *   </ResponsiveGrid>
 */

type Cols = 1 | 2 | 3 | 4 | 5 | 6 | 8 | 12;
type Bp = "base" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";

const BASE: Record<Cols, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
  6: "grid-cols-6",
  8: "grid-cols-8",
  12: "grid-cols-12",
};
const SM: Record<Cols, string> = {
  1: "sm:grid-cols-1",
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
  4: "sm:grid-cols-4",
  5: "sm:grid-cols-5",
  6: "sm:grid-cols-6",
  8: "sm:grid-cols-8",
  12: "sm:grid-cols-12",
};
const MD: Record<Cols, string> = {
  1: "md:grid-cols-1",
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
  5: "md:grid-cols-5",
  6: "md:grid-cols-6",
  8: "md:grid-cols-8",
  12: "md:grid-cols-12",
};
const LG: Record<Cols, string> = {
  1: "lg:grid-cols-1",
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
  5: "lg:grid-cols-5",
  6: "lg:grid-cols-6",
  8: "lg:grid-cols-8",
  12: "lg:grid-cols-12",
};
const XL: Record<Cols, string> = {
  1: "xl:grid-cols-1",
  2: "xl:grid-cols-2",
  3: "xl:grid-cols-3",
  4: "xl:grid-cols-4",
  5: "xl:grid-cols-5",
  6: "xl:grid-cols-6",
  8: "xl:grid-cols-8",
  12: "xl:grid-cols-12",
};
const X2: Record<Cols, string> = {
  1: "2xl:grid-cols-1",
  2: "2xl:grid-cols-2",
  3: "2xl:grid-cols-3",
  4: "2xl:grid-cols-4",
  5: "2xl:grid-cols-5",
  6: "2xl:grid-cols-6",
  8: "2xl:grid-cols-8",
  12: "2xl:grid-cols-12",
};
const X3: Record<Cols, string> = {
  1: "3xl:grid-cols-1",
  2: "3xl:grid-cols-2",
  3: "3xl:grid-cols-3",
  4: "3xl:grid-cols-4",
  5: "3xl:grid-cols-5",
  6: "3xl:grid-cols-6",
  8: "3xl:grid-cols-8",
  12: "3xl:grid-cols-12",
};
const X4: Record<Cols, string> = {
  1: "4xl:grid-cols-1",
  2: "4xl:grid-cols-2",
  3: "4xl:grid-cols-3",
  4: "4xl:grid-cols-4",
  5: "4xl:grid-cols-5",
  6: "4xl:grid-cols-6",
  8: "4xl:grid-cols-8",
  12: "4xl:grid-cols-12",
};

const TABLE: Record<Bp, Record<Cols, string>> = {
  base: BASE,
  sm: SM,
  md: MD,
  lg: LG,
  xl: XL,
  "2xl": X2,
  "3xl": X3,
  "4xl": X4,
};

const GAP_MAP = {
  none: "gap-0",
  xs: "gap-1.5",
  sm: "gap-2",
  md: "gap-3",
  lg: "gap-4",
  xl: "gap-5 md:gap-6",
  "2xl": "gap-6 md:gap-8",
} as const;

type Gap = keyof typeof GAP_MAP;

export type ResponsiveGridProps = {
  cols: Partial<Record<Bp, Cols>>;
  /** Inter-cell gap. Defaults to `lg` (16px). */
  gap?: Gap;
  /** Optional column gap override; falls back to `gap` if omitted. */
  colGap?: Gap;
  /** Optional row gap override; falls back to `gap` if omitted. */
  rowGap?: Gap;
  /** When true, applies `auto-rows-fr` so all cells stretch equally. */
  equalRows?: boolean;
  as?: ElementType;
  className?: string;
  children?: ReactNode;
} & Omit<HTMLAttributes<HTMLElement>, "className">;

export function ResponsiveGrid({
  cols,
  gap = "lg",
  colGap,
  rowGap,
  equalRows = false,
  as,
  className,
  children,
  ...rest
}: ResponsiveGridProps) {
  const Component: ElementType = as ?? "div";

  const classes: string[] = [];
  const order: Bp[] = ["base", "sm", "md", "lg", "xl", "2xl", "3xl", "4xl"];
  for (const bp of order) {
    const c = cols[bp];
    if (c) classes.push(TABLE[bp][c]);
  }

  const gapClass =
    colGap || rowGap
      ? cn(
          (colGap ? GAP_MAP[colGap] : GAP_MAP[gap]).replaceAll("gap-", "gap-x-"),
          (rowGap ? GAP_MAP[rowGap] : GAP_MAP[gap]).replaceAll("gap-", "gap-y-"),
        )
      : GAP_MAP[gap];

  return (
    <Component
      className={cn(
        "grid w-full",
        gapClass,
        equalRows && "auto-rows-fr",
        ...classes,
        className,
      )}
      {...rest}
    >
      {children}
    </Component>
  );
}
