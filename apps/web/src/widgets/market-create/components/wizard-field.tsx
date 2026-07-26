"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function WizardField({
  label,
  hint,
  error,
  children,
  trailing,
  className,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  trailing?: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block space-y-1.5", className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">
          {label}
        </span>
        {trailing}
      </div>
      {children}
      {error ? (
        <p className="text-[11px] font-medium text-rose-300/90">{error}</p>
      ) : hint ? (
        <p className="text-[11px] text-[var(--foreground-muted)]">{hint}</p>
      ) : null}
    </label>
  );
}

export const wizardInputClass = cn(
  "w-full rounded-xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--foreground)_5%,transparent)] px-3 py-2.5 text-sm text-[var(--foreground)]",
  "placeholder:text-[var(--foreground-muted)] outline-none transition",
  "focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-500/20",
  "aria-[invalid=true]:border-rose-400/40 aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-rose-500/20",
);
