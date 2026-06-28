"use client";

import { motion } from "framer-motion";
import { ArrowLeft, LogOut, Shield } from "lucide-react";
import { memo } from "react";
import { ROUTES } from "@/shared/constants/routes";
import { PrefetchLink } from "@/shared/ui";
import { cn } from "@/lib/utils";
import type { AdminTabConfig, AdminTabId } from "../lib/permissions";

export type AdminSidebarProps = {
  tabs: ReadonlyArray<AdminTabConfig>;
  active: AdminTabId;
  onSelect: (id: AdminTabId) => void;
  email: string | null;
  role: string;
  onSignOut: () => void;
  className?: string;
};

function AdminSidebarInner({
  tabs,
  active,
  onSelect,
  email,
  role,
  onSignOut,
  className,
}: AdminSidebarProps) {
  return (
    <aside
      className={cn(
        "flex shrink-0 flex-col rounded-2xl border border-[var(--hub-border)] bg-[var(--hub-card)]/90 shadow-[0_16px_40px_-24px_rgba(0,0,0,0.65)] ring-1 ring-[var(--hub-border)] backdrop-blur-sm",
        "lg:sticky lg:top-[calc(var(--app-topbar-row-h)+1rem)] lg:max-h-[calc(100dvh-var(--app-topbar-row-h)-2rem)] lg:w-60",
        className,
      )}
    >
      <header className="flex items-center gap-2.5 border-b border-[var(--hub-border)] px-4 py-3">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-[var(--hub-primary-soft)] ring-1 ring-[var(--hub-border-strong)]">
          <Shield className="h-4 w-4 text-[var(--hub-primary-bright)]" />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--hub-muted)]">
            Operator
          </p>
          <p className="truncate text-[13.5px] font-semibold tracking-tight text-[var(--hub-fg)]">
            Admin console
          </p>
        </div>
      </header>

      <nav
        aria-label="Admin sections"
        className="flex-1 overflow-y-auto px-2 py-3"
      >
        <ul className="space-y-0.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.id === active;
            return (
              <li key={tab.id}>
                <button
                  type="button"
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => onSelect(tab.id)}
                  className={cn(
                    "group flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition",
                    isActive
                      ? "bg-[var(--hub-primary-soft)] text-[var(--hub-fg)] ring-1 ring-[var(--hub-border-strong)]"
                      : "text-[var(--hub-muted)] hover:bg-[var(--hub-bg-subtle)]/80 hover:text-[var(--hub-fg)]",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-md ring-1",
                      isActive
                        ? "bg-[var(--hub-primary-soft)] text-[var(--hub-primary-bright)] ring-[var(--hub-border-strong)]"
                        : "bg-[var(--hub-bg-subtle)]/60 text-[var(--hub-muted)] ring-[var(--hub-border)] group-hover:text-[var(--hub-fg)]",
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[12.5px] font-semibold leading-tight">
                      {tab.label}
                    </span>
                    <span className="mt-0.5 block truncate text-[10px] text-[var(--hub-muted)]">
                      {tab.description}
                    </span>
                  </span>
                  {isActive ? (
                    <motion.span
                      layoutId="admin-sidebar-active"
                      aria-hidden
                      className="h-5 w-0.5 rounded-full bg-[var(--hub-primary-bright)]"
                      transition={{ type: "spring", stiffness: 460, damping: 32 }}
                    />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <footer className="space-y-2 border-t border-[var(--hub-border)] px-3 py-3 text-[11px]">
        <div className="rounded-xl bg-[var(--hub-bg-subtle)]/70 px-2.5 py-2 ring-1 ring-[var(--hub-border)]">
          <p className="truncate font-mono text-[11px] text-[var(--hub-fg)]">
            {email ?? "Operator"}
          </p>
          <span className="mt-1 inline-flex items-center gap-1 rounded-md bg-[var(--hub-primary-soft)] px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-[var(--hub-primary-bright)] ring-1 ring-[var(--hub-border)]">
            {role}
          </span>
        </div>
        <PrefetchLink
          href={ROUTES.dapp}
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[var(--hub-muted)] transition hover:bg-[var(--hub-bg-subtle)]/80 hover:text-[var(--hub-fg)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Home
        </PrefetchLink>
        <button
          type="button"
          onClick={onSignOut}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[var(--hub-danger)] transition hover:bg-[var(--hub-danger-bg)]"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </footer>
    </aside>
  );
}

export const AdminSidebar = memo(AdminSidebarInner);
