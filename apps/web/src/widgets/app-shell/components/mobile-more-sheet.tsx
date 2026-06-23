"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  Briefcase,
  LayoutGrid,
  Plus,
  Settings,
  Star,
  Trophy,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { ROUTES } from "@/shared/constants/routes";
import { cn } from "@/lib/utils";
import { useAppShellStore } from "../store/use-app-shell-store";
import { ConnectionIndicator } from "./connection-indicator";
import { ThemeToggle } from "./theme-toggle";

function SheetRow({
  href,
  onNavigate,
  icon: Icon,
  label,
}: {
  href: string;
  onNavigate: () => void;
  icon: LucideIcon;
  label: string;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 ring-1 ring-white/[0.06] transition hover:bg-white/[0.04]"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.05] text-cyan-300 ring-1 ring-white/[0.08]">
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <span className="min-w-0 text-[13px] font-semibold text-white">{label}</span>
    </Link>
  );
}

/**
 * Bottom sheet for secondary actions — sits above the mobile dock (no sidebar drawer).
 */
export function MobileMoreSheet() {
  const open = useAppShellStore((s) => s.mobileMoreMenuOpen);
  const setOpen = useAppShellStore((s) => s.setMobileMoreMenuOpen);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <AnimatePresence>
      {open ? (
        <div
          className="fixed inset-0 z-[44] lg:hidden"
          aria-modal="true"
          role="dialog"
          aria-label="More trading options"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-x-0 top-0 bg-black/60 backdrop-blur-[2px]"
            style={{ bottom: "var(--app-mobile-dock-h)" }}
            onClick={close}
          />
          <motion.div
            initial={{ y: "105%" }}
            animate={{ y: 0 }}
            exit={{ y: "105%" }}
            transition={{ type: "spring", stiffness: 420, damping: 36 }}
            className={cn(
              "absolute inset-x-2 max-h-[min(72vh,520px)] overflow-hidden rounded-t-2xl border border-white/[0.08]",
              "bg-[#0b0b14]/95 shadow-[0_-12px_48px_rgba(0,0,0,0.55)] backdrop-blur-xl",
            )}
            style={{ bottom: "var(--app-mobile-dock-h)" }}
          >
            <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-white/15" aria-hidden />
            <div className="max-h-[min(68vh,480px)] space-y-3 overflow-y-auto p-4 pb-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
                Trading
              </p>
              <div className="space-y-2">
                <SheetRow
                  href={ROUTES.marketsBrowse}
                  onNavigate={close}
                  icon={LayoutGrid}
                  label="Markets"
                />
                <SheetRow
                  href={ROUTES.watchlist}
                  onNavigate={close}
                  icon={Star}
                  label="Watchlist"
                />
                <SheetRow
                  href={ROUTES.portfolio}
                  onNavigate={close}
                  icon={Briefcase}
                  label="Portfolio"
                />
                <SheetRow
                  href={ROUTES.activity}
                  onNavigate={close}
                  icon={Activity}
                  label="Activity"
                />
                <SheetRow
                  href={ROUTES.wallet}
                  onNavigate={close}
                  icon={Wallet}
                  label="Wallet"
                />
                <SheetRow
                  href={ROUTES.marketCreate}
                  onNavigate={close}
                  icon={Plus}
                  label="Create market"
                />
                <SheetRow
                  href={ROUTES.leaderboard}
                  onNavigate={close}
                  icon={Trophy}
                  label="Leaderboard"
                />
                <SheetRow
                  href={ROUTES.settings}
                  onNavigate={close}
                  icon={Settings}
                  label="Settings"
                />
              </div>

              <div className="flex items-center justify-between gap-3 rounded-xl bg-black/30 px-3 py-2 ring-1 ring-white/[0.06]">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  Appearance
                </span>
                <ThemeToggle variant="pill" />
              </div>

              <ConnectionIndicator collapsed={false} />
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
