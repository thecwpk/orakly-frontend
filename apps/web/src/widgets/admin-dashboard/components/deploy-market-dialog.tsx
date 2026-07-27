"use client";

import { Dialog as DialogPrimitive } from "radix-ui";
import { Loader2, Rocket, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

function toLocalInputValue(isoOrDate: string | Date | undefined): string {
  const d =
    isoOrDate instanceof Date
      ? isoOrDate
      : isoOrDate
        ? new Date(isoOrDate)
        : new Date(Date.now() + 24 * 60 * 60 * 1000);
  if (Number.isNaN(d.getTime())) {
    const fallback = new Date(Date.now() + 24 * 60 * 60 * 1000);
    fallback.setMinutes(fallback.getMinutes() - fallback.getTimezoneOffset());
    return fallback.toISOString().slice(0, 16);
  }
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function fromLocalInputValue(local: string): string {
  return new Date(local).toISOString();
}

function isFutureDate(local: string): boolean {
  if (!local) return false;
  const d = new Date(local);
  return Number.isFinite(d.getTime()) && d.getTime() > Date.now();
}

const inputClass = cn(
  "admin-field-input w-full rounded-xl px-3 py-2.5 text-[13px] outline-none",
  "border border-[var(--hub-border-strong)] bg-[var(--hub-bg-subtle)] text-[var(--hub-fg)]",
  "placeholder:text-[var(--hub-muted)]",
  "focus:border-[var(--hub-primary)]/55 focus:ring-2 focus:ring-[var(--hub-primary)]/20",
);

export type DeployMarketDialogProps = {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  /** Single market title, or summary for bulk. */
  title: string;
  marketCount?: number;
  /** Prefill from DB closesAt when deploying one market. */
  initialClosesAt?: string | null;
  busy?: boolean;
  onConfirm: (closesAtIso: string) => void | Promise<void>;
};

export function DeployMarketDialog({
  open,
  onOpenChange,
  title,
  marketCount = 1,
  initialClosesAt,
  busy,
  onConfirm,
}: DeployMarketDialogProps) {
  const [endLocal, setEndLocal] = useState(() =>
    toLocalInputValue(initialClosesAt ?? undefined),
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const next = toLocalInputValue(initialClosesAt ?? undefined);
    // If stored end is already past, default to +24h so deploy is valid on-chain.
    setEndLocal(isFutureDate(next) ? next : toLocalInputValue(undefined));
    setError(null);
  }, [open, initialClosesAt]);

  const bulk = marketCount > 1;
  const subtitle = useMemo(() => {
    if (bulk) {
      return `Set one end time for all ${marketCount} markets. This becomes the on-chain endTime and DB closesAt.`;
    }
    return "Set when this market ends. Used as on-chain endTime and saved as closesAt before deploy.";
  }, [bulk, marketCount]);

  const submit = async () => {
    if (!isFutureDate(endLocal)) {
      setError("End time must be in the future");
      return;
    }
    setError(null);
    await onConfirm(fromLocalInputValue(endLocal));
  };

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
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2",
            "rounded-2xl bg-[var(--hub-card)] text-[var(--hub-fg)] ring-1 ring-emerald-500/25",
            "shadow-[0_20px_80px_-20px_rgba(0,0,0,0.6)] outline-none",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
            "data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95",
          )}
        >
          <header className="flex items-start justify-between gap-3 px-5 pb-3 pt-4">
            <div className="min-w-0 space-y-1">
              <div className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-200 ring-1 ring-emerald-400/30">
                <Rocket className="h-3 w-3" />
                Deploy on-chain
              </div>
              <DialogPrimitive.Title className="truncate text-[15px] font-semibold leading-snug">
                {bulk ? `Deploy ${marketCount} markets` : title}
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="text-[12.5px] text-[var(--hub-muted)]">
                {subtitle}
              </DialogPrimitive.Description>
            </div>
            <DialogPrimitive.Close
              disabled={busy}
              className="rounded-lg p-1.5 text-[var(--hub-muted)] transition hover:bg-[var(--hub-bg-subtle)] hover:text-[var(--hub-fg)] disabled:opacity-50"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </DialogPrimitive.Close>
          </header>

          <div className="space-y-3 px-5 pb-2">
            {!bulk ? (
              <p className="line-clamp-2 text-[12px] text-[var(--hub-muted)]">
                {title}
              </p>
            ) : null}
            <label className="block space-y-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--hub-muted)]">
                End time
              </span>
              <input
                type="datetime-local"
                value={endLocal}
                disabled={busy}
                onChange={(e) => {
                  setEndLocal(e.target.value);
                  setError(null);
                }}
                className={inputClass}
              />
              {error ? (
                <span className="block text-[11px] text-rose-300">{error}</span>
              ) : (
                <span className="block text-[11px] text-[var(--hub-muted)]">
                  Must be in the future. Cards show countdown from this time.
                </span>
              )}
            </label>
          </div>

          <footer className="flex items-center justify-end gap-2 px-5 py-4">
            <DialogPrimitive.Close
              disabled={busy}
              className="rounded-lg px-3 py-1.5 text-[12px] font-semibold text-[var(--hub-muted)] ring-1 ring-[var(--hub-border)] transition hover:bg-[var(--hub-bg-subtle)] hover:text-[var(--hub-fg)] disabled:opacity-50"
            >
              Cancel
            </DialogPrimitive.Close>
            <button
              type="button"
              disabled={busy}
              onClick={() => void submit()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/20 px-3 py-1.5 text-[12px] font-semibold text-emerald-100 ring-1 ring-emerald-400/35 transition hover:bg-emerald-500/30 disabled:opacity-50"
            >
              {busy ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Rocket className="h-3.5 w-3.5" />
              )}
              {busy ? "Deploying…" : bulk ? `Deploy ${marketCount}` : "Deploy"}
            </button>
          </footer>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
