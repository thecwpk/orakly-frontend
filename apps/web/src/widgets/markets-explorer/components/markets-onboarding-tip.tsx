"use client";

import { motion } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ROUTES } from "@/shared/constants/routes";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "orakly.discovery.onboarding.v1";

/**
 * One-time, dismissible cue for browse-first → trade-later flow (Polymarket-style mental model).
 */
export function MarketsOnboardingTip() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      setVisible(window.localStorage.getItem(STORAGE_KEY) !== "1");
    } catch {
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore quota */
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 380, damping: 32 }}
      className={cn(
        "relative overflow-hidden rounded-xl border border-[var(--hub-border)] bg-[var(--hub-card)] px-3 py-2.5 ring-1 ring-[var(--hub-border)]",
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-12 h-28 w-28 rounded-full bg-[var(--hub-primary-soft)] blur-3xl"
      />
      <div className="relative flex items-start gap-2.5">
        <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--hub-bg-subtle)] ring-1 ring-[var(--hub-border)]">
          <Sparkles className="h-3.5 w-3.5 text-[var(--hub-primary-bright)]" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--hub-primary-bright)]">
            Discover markets
          </p>
          <p className="mt-1 text-[12.5px] leading-snug text-[var(--hub-fg)]/90">
            Browse open markets and open any listing for details. Connect your wallet only when you
            are ready to place a trade. Track positions on{" "}
            <Link
              href={ROUTES.portfolio}
              className="text-[var(--hub-primary-bright)] underline-offset-2 hover:underline"
            >
              Portfolio
            </Link>
            .
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss tip"
          className="shrink-0 rounded-md p-1 text-[var(--hub-muted)] transition hover:bg-[var(--hub-primary-soft)] hover:text-[var(--hub-fg)]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}
