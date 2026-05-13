"use client";

import { Dialog as DialogPrimitive } from "radix-ui";
import { motion } from "framer-motion";
import { Loader2, Plus, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { adminApi } from "../lib/admin-api";
import {
  adminMarketsKey,
  adminOverviewKey,
  type AdminCategoryRow,
} from "../hooks/use-admin-queries";

type CreateState = {
  title: string;
  slug: string;
  description: string;
  categoryId: string;
  closesAt: string;
  takerFeeBps: number;
};

const DEFAULT_STATE: CreateState = {
  title: "",
  slug: "",
  description: "",
  categoryId: "",
  closesAt: "",
  takerFeeBps: 25,
};

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 100);
}

function isFutureDate(local: string): boolean {
  if (!local) return false;
  const d = new Date(local);
  return Number.isFinite(d.getTime()) && d.getTime() > Date.now();
}

export function CreateMarketDialog({
  open,
  onOpenChange,
  categories,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  categories: ReadonlyArray<AdminCategoryRow>;
}) {
  const [state, setState] = useState<CreateState>(DEFAULT_STATE);
  const [autoSlug, setAutoSlug] = useState(true);

  useEffect(() => {
    if (!open) {
      setState(DEFAULT_STATE);
      setAutoSlug(true);
    }
  }, [open]);

  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (s: CreateState) =>
      adminApi("/markets", {
        method: "POST",
        json: {
          title: s.title.trim(),
          slug: s.slug.trim(),
          description: s.description.trim() || undefined,
          closesAt: new Date(s.closesAt).toISOString(),
          takerFeeBps: s.takerFeeBps,
          ...(s.categoryId ? { categoryId: s.categoryId } : {}),
        },
      }),
    onSuccess: () => {
      toast.success("Market created");
      void qc.invalidateQueries({ queryKey: ["admin", "markets"] });
      void qc.invalidateQueries({ queryKey: adminMarketsKey("ALL", 80) });
      void qc.invalidateQueries({ queryKey: adminOverviewKey });
      onOpenChange(false);
    },
    onError: (e: unknown) => {
      toast.error(e instanceof Error ? e.message : "Create failed");
    },
  });

  const errors = useMemo(() => {
    const out: Partial<Record<keyof CreateState, string>> = {};
    if (state.title.trim().length < 4) out.title = "≥ 4 characters";
    if (state.slug.trim().length < 2) out.slug = "≥ 2 characters";
    if (!isFutureDate(state.closesAt)) out.closesAt = "Must be future";
    if (state.takerFeeBps < 0 || state.takerFeeBps > 500) {
      out.takerFeeBps = "0–500 bps";
    }
    return out;
  }, [state]);

  const canSubmit = Object.keys(errors).length === 0 && !mutation.isPending;

  const onTitleChange = (v: string) => {
    setState((s) => ({ ...s, title: v, slug: autoSlug ? slugify(v) : s.slug }));
  };

  const submit = () => {
    if (!canSubmit) return;
    mutation.mutate(state);
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
          aria-describedby={undefined}
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2",
            "max-h-[88vh] overflow-y-auto rounded-2xl bg-[#0a0a12] text-zinc-100 ring-1 ring-violet-400/20",
            "shadow-[0_20px_80px_-20px_rgba(0,0,0,0.6)]",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
            "data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95",
            "outline-none",
          )}
        >
          <header className="flex items-start justify-between gap-3 border-b border-white/[0.06] px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-violet-500/15 text-violet-300 ring-1 ring-violet-400/30">
                <Sparkles className="h-4 w-4" />
              </span>
              <div>
                <DialogPrimitive.Title className="text-[15px] font-semibold tracking-tight text-white">
                  Create market
                </DialogPrimitive.Title>
                <p className="text-[11.5px] text-zinc-500">
                  Markets open in <span className="font-mono">DRAFT</span>. Resolution emits
                  payouts and audit trail entries.
                </p>
              </div>
            </div>
            <DialogPrimitive.Close
              aria-label="Close"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/[0.04] text-zinc-300 ring-1 ring-white/[0.08] transition hover:bg-white/[0.08] hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </DialogPrimitive.Close>
          </header>

          <div className="space-y-3.5 px-5 py-4">
            <Field label="Title" hint="Question shown to traders" error={errors.title}>
              <input
                value={state.title}
                onChange={(e) => onTitleChange(e.target.value)}
                placeholder="Will BTC close > $100k by year-end?"
                className="w-full rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2.5 text-[13px] text-white outline-none focus:border-violet-500/50"
              />
            </Field>

            <Field
              label="Slug"
              hint="Auto-derived from the title"
              error={errors.slug}
              right={
                <button
                  type="button"
                  onClick={() => setAutoSlug((s) => !s)}
                  className="text-[10.5px] font-semibold text-violet-300 hover:underline"
                >
                  {autoSlug ? "Manual" : "Auto"}
                </button>
              }
            >
              <input
                value={state.slug}
                disabled={autoSlug}
                onChange={(e) => setState((s) => ({ ...s, slug: e.target.value }))}
                placeholder="btc-100k-eoy"
                className="w-full rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2.5 font-mono text-[13px] text-white outline-none focus:border-violet-500/50 disabled:opacity-60"
              />
            </Field>

            <Field label="Description" hint="Markdown rendered on market page (optional)">
              <textarea
                rows={3}
                value={state.description}
                onChange={(e) => setState((s) => ({ ...s, description: e.target.value }))}
                placeholder="Resolves YES if Coinbase BTC-USD daily close ≥ $100,000 on 2026-12-31…"
                className="w-full rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2 text-[13px] text-white outline-none focus:border-violet-500/50"
              />
            </Field>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Closes at" error={errors.closesAt}>
                <input
                  type="datetime-local"
                  value={state.closesAt}
                  onChange={(e) => setState((s) => ({ ...s, closesAt: e.target.value }))}
                  className="w-full rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2.5 text-[13px] text-white outline-none focus:border-violet-500/50"
                />
              </Field>
              <Field
                label="Taker fee"
                hint={`${state.takerFeeBps} bps (${(state.takerFeeBps / 100).toFixed(2)}%)`}
                error={errors.takerFeeBps}
              >
                <input
                  type="number"
                  min={0}
                  max={500}
                  step={5}
                  value={state.takerFeeBps}
                  onChange={(e) =>
                    setState((s) => ({
                      ...s,
                      takerFeeBps: Number.parseInt(e.target.value || "0", 10),
                    }))
                  }
                  className="w-full rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2.5 font-mono text-[13px] text-white outline-none focus:border-violet-500/50"
                />
              </Field>
            </div>

            <Field label="Category" hint="Drives discovery + landing rails">
              <select
                value={state.categoryId}
                onChange={(e) => setState((s) => ({ ...s, categoryId: e.target.value }))}
                className="w-full rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2.5 text-[13px] text-white outline-none focus:border-violet-500/50"
              >
                <option value="">— uncategorized —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.slug})
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <footer className="flex items-center justify-between gap-2 border-t border-white/[0.06] px-5 py-3">
            <p className="hidden text-[10.5px] text-zinc-500 sm:block">
              Status defaults to <span className="font-mono">DRAFT</span> · audit logged
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="rounded-xl bg-white/[0.04] px-3 py-2 text-[12.5px] font-semibold text-zinc-300 ring-1 ring-white/[0.08] transition hover:bg-white/[0.08]"
              >
                Cancel
              </button>
              <motion.button
                type="button"
                whileTap={{ scale: 0.99 }}
                disabled={!canSubmit}
                onClick={submit}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-500 to-cyan-500 px-3.5 py-2 text-[12.5px] font-bold text-white shadow-[0_8px_30px_-8px_rgba(167,139,250,0.6)] ring-1 ring-violet-400/40 transition hover:brightness-110 disabled:opacity-40"
              >
                {mutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
                Publish draft
              </motion.button>
            </div>
          </footer>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function Field({
  label,
  hint,
  error,
  right,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
          {label}
        </span>
        {right}
      </div>
      {children}
      <div className="mt-1 flex items-center justify-between">
        {hint ? <p className="text-[10.5px] text-zinc-500">{hint}</p> : <span />}
        {error ? (
          <p className="text-[10.5px] font-semibold text-rose-300">{error}</p>
        ) : null}
      </div>
    </label>
  );
}
