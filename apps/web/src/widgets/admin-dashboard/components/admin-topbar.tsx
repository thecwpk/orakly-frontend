"use client";

import { Menu, Shield } from "lucide-react";
import { memo } from "react";
import type { AdminTabConfig } from "../lib/permissions";

export type AdminTopbarProps = {
  active: AdminTabConfig | null;
  onOpenDrawer: () => void;
};

/** Mobile-only sticky topbar — opens the sidebar drawer. */
function AdminTopbarInner({ active, onOpenDrawer }: AdminTopbarProps) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-white/[0.06] bg-[#06060a]/85 px-4 py-2.5 backdrop-blur-md lg:hidden">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenDrawer}
          aria-label="Open admin menu"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-white/[0.04] text-zinc-200 ring-1 ring-white/[0.08] transition hover:bg-white/[0.08]"
        >
          <Menu className="h-4 w-4" />
        </button>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
            Admin
          </p>
          <p className="text-[13px] font-semibold tracking-tight text-white">
            {active?.label ?? "Console"}
          </p>
        </div>
      </div>
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-violet-500/40 to-cyan-500/30 ring-1 ring-violet-400/30">
        <Shield className="h-3.5 w-3.5 text-violet-200" />
      </span>
    </header>
  );
}

export const AdminTopbar = memo(AdminTopbarInner);
