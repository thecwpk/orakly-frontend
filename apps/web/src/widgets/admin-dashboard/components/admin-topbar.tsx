"use client";

import { Menu, Shield } from "lucide-react";
import { memo } from "react";
import { cn } from "@/lib/utils";
import type { AdminTabConfig } from "../lib/permissions";

export type AdminTopbarProps = {
  active: AdminTabConfig | null;
  onOpenDrawer: () => void;
};

/** Mobile-only section header below the global AppTopbar. */
function AdminTopbarInner({ active, onOpenDrawer }: AdminTopbarProps) {
  return (
    <header
      className={cn(
        "sticky z-20 flex items-center justify-between gap-3 border-b px-4 py-2.5 backdrop-blur-md lg:hidden",
        "border-[var(--hub-border)] bg-[var(--hub-chrome)]/90",
        "top-[var(--app-topbar-row-h)]",
      )}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenDrawer}
          aria-label="Open admin menu"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-[var(--hub-bg-subtle)] text-[var(--hub-fg)] ring-1 ring-[var(--hub-border)] transition hover:bg-[var(--hub-card)]"
        >
          <Menu className="h-4 w-4" />
        </button>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--hub-muted)]">
            Admin
          </p>
          <p className="text-[13px] font-semibold tracking-tight text-[var(--hub-fg)]">
            {active?.label ?? "Console"}
          </p>
        </div>
      </div>
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-[var(--hub-primary-soft)] ring-1 ring-[var(--hub-border-strong)]">
        <Shield className="h-3.5 w-3.5 text-[var(--hub-primary-bright)]" />
      </span>
    </header>
  );
}

export const AdminTopbar = memo(AdminTopbarInner);
