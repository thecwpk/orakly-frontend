import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * A premium 1px gradient divider that fades to transparent at the edges —
 * the signature visual rhythm marker used on Linear, Stripe, and Vercel
 * dashboards. Always renders 1 device pixel high.
 *
 *   <Hairline />                         // horizontal, default
 *   <Hairline orientation="vertical" />  // vertical (auto-stretch)
 *   <Hairline tone="accent" />           // cyan tint
 */
export function Hairline({
  orientation = "horizontal",
  tone = "default",
  className,
  ...rest
}: {
  orientation?: "horizontal" | "vertical";
  tone?: "default" | "accent" | "success" | "danger";
  className?: string;
} & Omit<HTMLAttributes<HTMLDivElement>, "className">) {
  const grad =
    tone === "accent"
      ? "from-transparent via-cyan-400/30 to-transparent"
      : tone === "success"
        ? "from-transparent via-emerald-400/30 to-transparent"
        : tone === "danger"
          ? "from-transparent via-rose-400/30 to-transparent"
          : "from-transparent via-white/10 to-transparent";

  return (
    <div
      role="separator"
      aria-orientation={orientation}
      className={cn(
        orientation === "horizontal"
          ? "h-px w-full bg-gradient-to-r"
          : "w-px self-stretch bg-gradient-to-b",
        grad,
        className,
      )}
      {...rest}
    />
  );
}
