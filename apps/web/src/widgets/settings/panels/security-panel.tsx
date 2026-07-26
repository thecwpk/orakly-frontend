"use client";

import { LogOut, ShieldCheck, Smartphone } from "lucide-react";
import {
  SettingsPanel,
  SettingsRow,
} from "../components/settings-panel";
import { cn } from "@/lib/utils";

type Session = {
  id: string;
  device: string;
  location: string;
  lastSeen: string;
  current: boolean;
};

const SESSIONS: Session[] = [
  { id: "1", device: "Chrome · macOS", location: "Berlin · DE", lastSeen: "Active now", current: true },
  { id: "2", device: "Safari · iOS", location: "Munich · DE", lastSeen: "2h ago", current: false },
  { id: "3", device: "MetaMask · Mobile", location: "Berlin · DE", lastSeen: "1d ago", current: false },
];

export function SecuritySettingsPanel() {
  return (
    <SettingsPanel
      title="Security"
      description="Active sessions, sign-out controls, and signing scope."
    >
      <SettingsRow
        label="Wallet signing"
        hint="Re-sign every 24h to maintain a fresh session cookie for protected routes."
      >
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500/10 px-3 py-2 text-[12px] font-medium text-cyan-200 ring-1 ring-cyan-400/30 transition hover:bg-cyan-500/15"
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          Re-sign now
        </button>
      </SettingsRow>

      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">
          Active sessions
        </p>
        <div className="overflow-hidden rounded-xl border border-[var(--border)]">
          <ul className="divide-y divide-[var(--border)]">
            {SESSIONS.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between gap-3 px-3 py-2.5 hover:bg-[color-mix(in_srgb,var(--foreground)_5%,transparent)]"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg ring-1",
                      s.current
                        ? "bg-emerald-500/10 text-emerald-300 ring-emerald-400/30"
                        : "bg-[color-mix(in_srgb,var(--foreground)_4%,transparent)] text-[var(--foreground-muted)] ring-[var(--border)]",
                    )}
                  >
                    <Smartphone className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[12.5px] text-[var(--foreground)]">{s.device}</p>
                    <p className="text-[11px] text-[var(--foreground-muted)]">
                      {s.location} · {s.lastSeen}
                    </p>
                  </div>
                </div>
                {s.current ? (
                  <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-300 ring-1 ring-emerald-400/30">
                    Current
                  </span>
                ) : (
                  <button
                    type="button"
                    className="rounded-md bg-[color-mix(in_srgb,var(--foreground)_4%,transparent)] px-2 py-1 text-[11px] font-medium text-[var(--foreground)]/80 ring-1 ring-[var(--border)] transition hover:bg-rose-500/10 hover:text-rose-200 hover:ring-rose-400/30"
                  >
                    Revoke
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-xl border border-rose-500/20 bg-rose-500/[0.04] p-4">
        <p className="text-[12.5px] font-medium text-rose-100">Danger zone</p>
        <p className="mt-1 text-[11.5px] text-rose-200/70">
          Sign out everywhere terminates every session including this one.
        </p>
        <button
          type="button"
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-rose-500/15 px-3 py-2 text-[12px] font-semibold text-rose-100 ring-1 ring-rose-400/30 transition hover:bg-rose-500/25"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out everywhere
        </button>
      </div>
    </SettingsPanel>
  );
}
