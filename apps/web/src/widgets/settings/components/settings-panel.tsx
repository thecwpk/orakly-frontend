"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { useHydrationSafeReducedMotion } from "@/lib/use-hydration-safe-reduced-motion";

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
      className="glass-panel-strong rounded-2xl p-5 sm:p-6"
    >
      <header className="border-b border-white/[0.06] pb-4">
        <h2 className="text-[15px] font-semibold tracking-tight text-white">
          {title}
        </h2>
        <p className="mt-1 text-[12.5px] leading-relaxed text-zinc-500">
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
    <div className="flex flex-col gap-2 border-b border-white/[0.04] pb-5 last:border-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <div className="min-w-0 sm:max-w-xs">
        <p className="text-[12.5px] font-medium text-white">{label}</p>
        {hint ? (
          <p className="mt-1 text-[11.5px] leading-relaxed text-zinc-500">
            {hint}
          </p>
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
      className="relative h-6 w-10 shrink-0 rounded-full bg-white/[0.08] ring-1 ring-white/10 transition aria-checked:bg-cyan-500/60 aria-checked:ring-cyan-400/40"
    >
      <span
        className="absolute top-0.5 left-0.5 inline-block h-5 w-5 rounded-full bg-white shadow transition-transform"
        style={{ transform: checked ? "translateX(16px)" : "translateX(0)" }}
      />
    </button>
  );
}
