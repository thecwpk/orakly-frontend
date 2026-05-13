"use client";

import { motion } from "framer-motion";
import { ArrowLeft, LogOut, Shield } from "lucide-react";
import Link from "next/link";
import { memo } from "react";
import { cn } from "@/lib/utils";
import type { AdminTabConfig, AdminTabId } from "../lib/permissions";

export type AdminSidebarProps = {
  tabs: ReadonlyArray<AdminTabConfig>;
  active: AdminTabId;
  onSelect: (id: AdminTabId) => void;
  email: string | null;
  role: string;
  onSignOut: () => void;
  /** Hide on mobile when the user closes the drawer. */
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
        "glass-panel-strong flex shrink-0 flex-col rounded-2xl ring-1 ring-white/[0.06]",
        "lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:w-60",
        className,
      )}
    >
      <header className="flex items-center gap-2.5 border-b border-white/[0.06] px-4 py-3">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-violet-500/40 to-cyan-500/30 ring-1 ring-violet-400/30">
          <Shield className="h-4 w-4 text-violet-200" />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
            Operator
          </p>
          <p className="truncate text-[13.5px] font-semibold tracking-tight text-white">
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
                      ? "bg-white/[0.06] text-white ring-1 ring-violet-400/30"
                      : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-md ring-1",
                      isActive
                        ? "bg-violet-500/15 text-violet-200 ring-violet-400/30"
                        : "bg-white/[0.03] text-zinc-400 ring-white/[0.06] group-hover:text-zinc-200",
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[12.5px] font-semibold leading-tight">
                      {tab.label}
                    </span>
                    <span className="mt-0.5 block truncate text-[10px] text-zinc-500">
                      {tab.description}
                    </span>
                  </span>
                  {isActive ? (
                    <motion.span
                      layoutId="admin-sidebar-active"
                      aria-hidden
                      className="h-5 w-0.5 rounded-full bg-gradient-to-b from-violet-300 to-cyan-300"
                      transition={{ type: "spring", stiffness: 460, damping: 32 }}
                    />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <footer className="space-y-2 border-t border-white/[0.06] px-3 py-3 text-[11px]">
        <div className="rounded-xl bg-black/30 px-2.5 py-2 ring-1 ring-white/[0.05]">
          <p className="truncate font-mono text-[11px] text-zinc-300">
            {email ?? "Operator"}
          </p>
          <span className="mt-1 inline-flex items-center gap-1 rounded-md bg-violet-500/10 px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-violet-200 ring-1 ring-violet-400/25">
            {role}
          </span>
        </div>
        <Link
          href="/"
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-zinc-400 transition hover:bg-white/[0.04] hover:text-zinc-100"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to site
        </Link>
        <button
          type="button"
          onClick={onSignOut}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-rose-300 transition hover:bg-rose-500/10"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </footer>
    </aside>
  );
}

export const AdminSidebar = memo(AdminSidebarInner);
