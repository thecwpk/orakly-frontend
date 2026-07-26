"use client";

import { Dialog as DialogPrimitive } from "radix-ui";
import { motion } from "framer-motion";
import { AlertTriangle, Loader2, X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ConfirmDialogTone = "danger" | "warning" | "info";

export type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  title: string;
  description: ReactNode;
  /** Label of the confirm button. */
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmDialogTone;
  busy?: boolean;
  onConfirm: () => void | Promise<void>;
};

const TONE: Record<ConfirmDialogTone, { ring: string; pill: string; cta: string; icon: string }> = {
  danger: {
    ring: "ring-rose-500/25",
    pill: "bg-rose-500/15 text-rose-200 ring-rose-400/30",
    cta: "bg-gradient-to-r from-rose-500 to-amber-500 text-zinc-950 ring-rose-400/40",
    icon: "text-rose-300",
  },
  warning: {
    ring: "ring-amber-500/25",
    pill: "bg-amber-500/15 text-amber-200 ring-amber-400/30",
    cta: "bg-gradient-to-r from-amber-400 to-orange-400 text-zinc-950 ring-amber-300/40",
    icon: "text-amber-300",
  },
  info: {
    ring: "ring-cyan-500/25",
    pill: "bg-cyan-500/10 text-cyan-200 ring-cyan-400/25",
    cta: "bg-gradient-to-r from-cyan-400 to-violet-400 text-zinc-950 ring-cyan-300/40",
    icon: "text-cyan-300",
  },
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "info",
  busy,
  onConfirm,
}: ConfirmDialogProps) {
  const t = TONE[tone];

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-[#03030780]/85 supports-[backdrop-filter]:backdrop-blur-md",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
          )}
        />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2",
            "rounded-2xl bg-[var(--hub-card)] text-[var(--hub-fg)] ring-1 shadow-[0_20px_80px_-20px_rgba(0,0,0,0.6)]",
            t.ring,
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
            "data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95",
            "outline-none",
          )}
        >
          <header className="flex items-start justify-between gap-3 px-5 pb-3 pt-4">
            <span
              className={cn(
                "inline-flex h-9 w-9 items-center justify-center rounded-md ring-1",
                t.pill,
              )}
            >
              <AlertTriangle className={cn("h-4 w-4", t.icon)} />
            </span>
            <div className="min-w-0 flex-1">
              <DialogPrimitive.Title className="text-[15px] font-semibold tracking-tight text-[var(--hub-fg)]">
                {title}
              </DialogPrimitive.Title>
            </div>
            <DialogPrimitive.Close
              aria-label="Close"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[var(--hub-bg-subtle)] text-[var(--hub-muted)] ring-1 ring-[var(--hub-border)] transition hover:bg-[var(--hub-card-hover)] hover:text-[var(--hub-fg)]"
            >
              <X className="h-3.5 w-3.5" />
            </DialogPrimitive.Close>
          </header>

          <div className="px-5 pb-4 text-[12.5px] leading-relaxed text-[var(--hub-muted)]">
            {description}
          </div>

          <footer className="grid grid-cols-[1fr_2fr] gap-2 border-t border-[var(--hub-border)] p-3">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={busy}
              className="h-10 rounded-xl bg-[var(--hub-bg-subtle)] text-[13px] font-semibold text-[var(--hub-muted)] ring-1 ring-[var(--hub-border)] transition hover:bg-[var(--hub-card-hover)] hover:text-[var(--hub-fg)] disabled:opacity-50"
            >
              {cancelLabel}
            </button>
            <motion.button
              type="button"
              whileTap={{ scale: 0.99 }}
              disabled={busy}
              onClick={() => void onConfirm()}
              className={cn(
                "inline-flex h-10 items-center justify-center gap-2 rounded-xl text-[13px] font-bold ring-1 transition hover:brightness-110 disabled:opacity-50",
                t.cta,
              )}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {confirmLabel}
            </motion.button>
          </footer>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
