"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useHydrationSafeReducedMotion } from "@/lib/use-hydration-safe-reduced-motion";

export const settingsInsetClass =
  "rounded-lg border border-[var(--hub-border)] bg-[var(--hub-bg-subtle)]";

export const settingsChoiceActiveClass =
  "bg-[var(--hub-primary-soft)] text-[var(--hub-fg)] ring-1 ring-[var(--hub-border-strong)]";

export const settingsChoiceInactiveClass =
  "text-[var(--hub-muted)] hover:text-[var(--hub-fg)]";

export const settingsInputClass = cn(
  "w-full rounded-lg border border-[var(--hub-border)] bg-[var(--hub-bg-subtle)] px-3 py-2.5 text-sm text-[var(--hub-fg)]",
  "placeholder:text-[var(--hub-muted)] outline-none transition",
  "focus:border-[var(--hub-primary)]/50 focus:ring-2 focus:ring-[var(--hub-primary)]/20",
);

export function SettingsPanel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  const reduceMotion = useHydrationSafeReducedMotion();
  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="settings-content-panel rounded-2xl p-5 sm:p-6"
    >
      <header className="border-b border-[var(--hub-border)] pb-4">
        <h2 className="text-[15px] font-semibold tracking-tight text-[var(--hub-fg)]">
          {title}
        </h2>
        <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--hub-muted)]">
          {description}
        </p>
      </header>
      <div className="mt-5 space-y-5">{children}</div>
    </motion.section>
  );
}

export function SettingsRow({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 border-b border-[var(--hub-border)] pb-5 last:border-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <div className="min-w-0 sm:max-w-xs">
        <p className="text-[12.5px] font-medium text-[var(--hub-fg)]">{label}</p>
        {hint ? (
          <p className="mt-1 text-[11.5px] leading-relaxed text-[var(--hub-muted)]">{hint}</p>
        ) : null}
      </div>
      <div className="min-w-0 flex-1 sm:max-w-sm">{children}</div>
    </div>
  );
}

export function SettingsToggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-6 w-10 shrink-0 rounded-full ring-1 transition",
        checked
          ? "bg-[var(--hub-primary)]/70 ring-[var(--hub-primary)]/40"
          : "bg-[var(--hub-bg-subtle)] ring-[var(--hub-border)]",
      )}
    >
      <span
        className="absolute top-0.5 left-0.5 inline-block h-5 w-5 rounded-full bg-white shadow transition-transform"
        style={{ transform: checked ? "translateX(16px)" : "translateX(0)" }}
      />
    </button>
  );
}
