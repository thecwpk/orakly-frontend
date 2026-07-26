"use client";

import { motion } from "framer-motion";
import {
  Bell,
  Lock,
  Palette,
  Settings as SettingsIcon,
  Sliders,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import "../settings-tokens.css";

type SettingsLink = {
  href: string;
  label: string;
  blurb: string;
  icon: LucideIcon;
};

export const SETTINGS_LINKS: readonly SettingsLink[] = [
  {
    href: "/settings",
    label: "General",
    blurb: "Display name, locale, defaults.",
    icon: SettingsIcon,
  },
  {
    href: "/settings/trading",
    label: "Trading",
    blurb: "Slippage, fee preference, hotkeys.",
    icon: Sliders,
  },
  {
    href: "/settings/notifications",
    label: "Notifications",
    blurb: "Fills, settles, mentions, alerts.",
    icon: Bell,
  },
  {
    href: "/settings/appearance",
    label: "Appearance",
    blurb: "Theme, density, motion.",
    icon: Palette,
  },
  {
    href: "/settings/security",
    label: "Security",
    blurb: "Sessions, signing, sign-out.",
    icon: Lock,
  },
];

export function SettingsShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/settings";

  return (
    <main className="settings-root mx-auto max-w-6xl pb-s64 pt-s48 md:pt-s56">
      <header className="mb-s48">
        <h1 className="text-balance text-2xl font-semibold tracking-tight text-[var(--hub-fg)] sm:text-[1.65rem]">
          Account & trading
        </h1>
        <p className="mt-1 text-[13px] text-[var(--hub-muted)]">
          Preferences for your session and trading defaults.
        </p>
      </header>

      <div className="grid gap-r24 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start lg:gap-s48">
        <nav
          aria-label="Settings sections"
          className="settings-nav-panel sticky top-[5.5rem] rounded-2xl p-2 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto"
        >
          <ul className="space-y-0.5">
            {SETTINGS_LINKS.map((link) => {
              const active =
                link.href === "/settings"
                  ? pathname === "/settings"
                  : pathname.startsWith(link.href);
              const Icon = link.icon;
              return (
                <li key={link.href} className="relative">
                  <Link
                    href={link.href}
                    className={cn(
                      "block rounded-lg px-2.5 py-2 transition",
                      active
                        ? "bg-[var(--hub-primary-soft)] text-[var(--hub-fg)] ring-1 ring-[var(--hub-border-strong)]"
                        : "text-[var(--hub-muted)] hover:bg-[color-mix(in_srgb,var(--foreground)_5%,transparent)] hover:text-[var(--hub-fg)]",
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    <span className="flex items-center gap-2">
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      <span className="text-[13px] font-medium">{link.label}</span>
                    </span>
                    <span className="mt-0.5 block pl-[1.375rem] text-[10.5px] leading-snug text-[var(--hub-muted)]">
                      {link.blurb}
                    </span>
                  </Link>
                  {active ? (
                    <motion.span
                      layoutId="settings-active-indicator"
                      className="absolute inset-y-1 -left-0.5 w-0.5 rounded-full bg-gradient-to-b from-[var(--hub-primary-bright)] to-violet-400"
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  ) : null}
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="min-w-0">{children}</div>
      </div>
    </main>
  );
}
