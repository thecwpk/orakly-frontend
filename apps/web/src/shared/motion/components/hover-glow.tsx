"use client";

import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

export type HoverGlowAccent =
  | "cyan"
  | "violet"
  | "emerald"
  | "rose"
  | "amber"
  | "neutral";

const ACCENT: Record<HoverGlowAccent, string> = {
  cyan: "rgba(34, 211, 238, 0.32)",
  violet: "rgba(167, 139, 250, 0.30)",
  emerald: "rgba(110, 231, 183, 0.30)",
  rose: "rgba(251, 113, 133, 0.30)",
  amber: "rgba(251, 191, 36, 0.30)",
  neutral: "rgba(255, 255, 255, 0.18)",
};

export type HoverGlowProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  /** Accent color for the radial highlight. */
  accent?: HoverGlowAccent;
  /** Highlight radius (px). Default 240. */
  radius?: number;
  /** Disable the hover effect entirely. */
  disabled?: boolean;
  /** Inner padding wrapper (string Tailwind classes). */
  innerClassName?: string;
};

/**
 * Premium pointer-tracked hover glow.
 *
 * The glow is *purely compositor-driven*: pointer events update two CSS
 * custom properties (`--mx`, `--my`) which feed a `radial-gradient`. There
 * are **no React state updates per pointer move**, so it scales to dense
 * card grids without dropping frames.
 *
 *   <HoverGlow accent="cyan"><MarketCard /></HoverGlow>
 *
 * Accessibility:
 *   - The glow is purely decorative (`aria-hidden`).
 *   - Reduced-motion users get a static subtle ring instead of a tracker.
 */
export const HoverGlow = forwardRef<HTMLDivElement, HoverGlowProps>(
  function HoverGlow(
    {
      children,
      accent = "cyan",
      radius = 240,
      disabled = false,
      className,
      innerClassName,
      style,
      ...rest
    },
    forwardedRef,
  ) {
    const wrapperRef = useRef<HTMLDivElement | null>(null);
    useImperativeHandle(forwardedRef, () => wrapperRef.current!, []);

    const handleMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
      if (disabled) return;
      const node = wrapperRef.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      // Bypass React: write directly to CSS custom properties — no re-render.
      node.style.setProperty("--mx", `${x}px`);
      node.style.setProperty("--my", `${y}px`);
      node.style.setProperty("--glow-opacity", "1");
    }, [disabled]);

    const handleLeave = useCallback(() => {
      const node = wrapperRef.current;
      if (!node) return;
      node.style.setProperty("--glow-opacity", "0");
    }, []);

    const cssVars: CSSProperties = {
      ...(style as CSSProperties | undefined),
      ["--glow-color" as string]: ACCENT[accent],
      ["--glow-radius" as string]: `${radius}px`,
    };

    return (
      <div
        ref={wrapperRef}
        onPointerMove={handleMove}
        onPointerLeave={handleLeave}
        className={cn("hover-glow relative isolate", className)}
        style={cssVars}
        {...rest}
      >
        <div
          aria-hidden
          className="hover-glow__layer pointer-events-none absolute inset-0 -z-10 rounded-[inherit] opacity-0 transition-opacity duration-200"
        />
        <div className={cn("relative z-0", innerClassName)}>{children}</div>
      </div>
    );
  },
);
