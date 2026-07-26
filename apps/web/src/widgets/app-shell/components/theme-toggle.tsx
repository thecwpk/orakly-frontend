"use client";

import { motion } from "framer-motion";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const ORDER = ["light", "system", "dark"] as const;

const ICONS = {
  light: Sun,
  dark: Moon,
  system: Monitor,
} as const;

const LABEL = {
  light: "Light",
  dark: "Dark",
  system: "System",
} as const;

type Variant = "icon" | "rail" | "pill";

export function ThemeToggle({
  variant = "icon",
  className,
}: {
  variant?: Variant;
  className?: string;
}) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const current =
    !mounted || !theme
      ? "dark"
      : (theme === "system"
          ? "system"
          : (resolvedTheme as "light" | "dark") ?? "dark");
  const Icon = ICONS[current as keyof typeof ICONS] ?? Moon;

  const next = () => {
    const idx = ORDER.indexOf(theme as (typeof ORDER)[number]);
    const nxt = ORDER[(idx + 1) % ORDER.length] ?? "dark";
    setTheme(nxt);
  };

  if (variant === "rail") {
    return (
      <button
        type="button"
        onClick={next}
        aria-label={`Theme: ${LABEL[current as keyof typeof LABEL]}. Click to cycle.`}
        title={`Theme: ${LABEL[current as keyof typeof LABEL]}`}
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-lg bg-[color-mix(in_srgb,var(--foreground)_4%,transparent)] text-[var(--foreground-muted)] ring-1 ring-[var(--border)] transition hover:bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)] hover:text-[var(--foreground)]",
          className,
        )}
      >
        <motion.span
          key={current}
          initial={{ opacity: 0, rotate: -10 }}
          animate={{ opacity: 1, rotate: 0 }}
          transition={{ duration: 0.18 }}
        >
          <Icon className="h-3.5 w-3.5" />
        </motion.span>
      </button>
    );
  }

  if (variant === "pill") {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-0.5 rounded-lg bg-[color-mix(in_srgb,var(--foreground)_4%,transparent)] p-0.5 ring-1 ring-[var(--border)]",
          className,
        )}
        role="group"
        aria-label="Theme"
      >
        {ORDER.map((opt) => {
          const OptIcon = ICONS[opt];
          const active = theme === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => setTheme(opt)}
              aria-pressed={active}
              aria-label={LABEL[opt]}
              title={LABEL[opt]}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-md transition",
                active
                  ? "bg-[color-mix(in_srgb,var(--accent)_18%,transparent)] text-[var(--foreground)] ring-1 ring-[var(--accent)]/30"
                  : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]",
              )}
            >
              <OptIcon className="h-3 w-3" />
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={next}
      aria-label={`Theme: ${LABEL[current as keyof typeof LABEL]}. Click to cycle.`}
      title={`Theme: ${LABEL[current as keyof typeof LABEL]}`}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[color-mix(in_srgb,var(--foreground)_4%,transparent)] text-[var(--foreground-muted)] ring-1 ring-[var(--border)] transition hover:bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)] hover:text-[var(--foreground)]",
        className,
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
