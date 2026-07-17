"use client";

import { Dialog as DialogPrimitive } from "radix-ui";
import { CheckCircle2, Loader2, Plus, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { invalidateMarketsFeed } from "@/shared/api/invalidate";
import { fetchAdminConfig } from "../lib/admin-api";
import {
  adminMarketsKey,
  adminOverviewKey,
} from "../hooks/use-admin-queries";
import { adminApi } from "../lib/admin-api";

export const ADMIN_MARKET_CATEGORIES = [
  { value: "meme", label: "Meme" },
  { value: "defi", label: "DeFi" },
  { value: "layer1", label: "Layer1" },
  { value: "layer2", label: "Layer2" },
  { value: "ai", label: "AI" },
  { value: "other", label: "Other" },
] as const;

export type AdminMarketCategory = (typeof ADMIN_MARKET_CATEGORIES)[number]["value"];

type CreateState = {
  question: string;
  adminCategory: AdminMarketCategory | "";
  narrativeSlug: string;
  resolutionSource: string;
  resolutionDate: string;
  creatorRewardPercent: number;
  minimumBetBnb: number;
};

function defaultResolutionDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 90);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

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

const adminInputClass = cn(
  "admin-field-input w-full rounded-xl px-3 py-2.5 text-[13px] outline-none",
  "border border-[var(--hub-border-strong)] bg-[var(--hub-bg-subtle)] text-[var(--hub-fg)]",
  "placeholder:text-[var(--hub-muted)]",
  "focus:border-[var(--hub-primary)]/55 focus:ring-2 focus:ring-[var(--hub-primary)]/20",
);

export function CreateMarketDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
}) {
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [state, setState] = useState<CreateState>({
    question: "",
    adminCategory: "",
    narrativeSlug: "",
    resolutionSource: "",
    resolutionDate: defaultResolutionDate(),
    creatorRewardPercent: 5,
    minimumBetBnb: 0.01,
  });

  const configQ = useQuery({
    queryKey: ["admin", "config", "creator-reward"],
    queryFn: async () => {
      const { configs } = await fetchAdminConfig();
      const raw = configs.creator_default_reward_percent;
      const parsed = Number.parseFloat(raw ?? "5");
      return Number.isFinite(parsed) ? parsed : 5;
    },
    staleTime: 60_000,
    enabled: open,
  });

  useEffect(() => {
    if (!open) {
      setCreatedId(null);
      setState({
        question: "",
        adminCategory: "",
        narrativeSlug: "",
        resolutionSource: "",
        resolutionDate: defaultResolutionDate(),
        creatorRewardPercent: configQ.data ?? 5,
        minimumBetBnb: 0.01,
      });
    }
  }, [open, configQ.data]);

  useEffect(() => {
    if (configQ.data != null && open && !createdId) {
      setState((s) => ({ ...s, creatorRewardPercent: configQ.data! }));
    }
  }, [configQ.data, open, createdId]);

  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (s: CreateState) =>
      adminApi<{ id: string; title: string }>("/markets", {
        method: "POST",
        json: {
          title: s.question.trim(),
          slug: slugify(s.question),
          adminCategory: s.adminCategory || undefined,
          narrative: s.narrativeSlug.trim() || undefined,
          resolutionSource: s.resolutionSource.trim(),
          closesAt: new Date(s.resolutionDate).toISOString(),
          creatorRewardPercent: s.creatorRewardPercent,
          minimumBetBnb: s.minimumBetBnb,
        },
      }),
    onSuccess: (data) => {
      setCreatedId(data.id);
      toast.success("Market created in DB. Deploy on-chain to make it tradeable.");
      void qc.invalidateQueries({ queryKey: ["admin", "markets"] });
      void qc.invalidateQueries({ queryKey: adminMarketsKey("ALL", 120) });
      void qc.invalidateQueries({ queryKey: adminOverviewKey });
      invalidateMarketsFeed(qc);
    },
    onError: (e: unknown) => {
      toast.error(e instanceof Error ? e.message : "Create failed");
    },
  });

  const errors = useMemo(() => {
    const out: Partial<Record<keyof CreateState, string>> = {};
    if (state.question.trim().length < 10) out.question = "At least 10 characters";
    if (!state.adminCategory) out.adminCategory = "Required";
    if (state.narrativeSlug.trim().length < 2) out.narrativeSlug = "At least 2 characters";
    if (state.resolutionSource.trim().length < 2) {
      out.resolutionSource = "Required";
    }
    if (!isFutureDate(state.resolutionDate)) out.resolutionDate = "Must be in the future";
    if (state.creatorRewardPercent < 0 || state.creatorRewardPercent > 20) {
      out.creatorRewardPercent = "0 to 20%";
    }
    if (state.minimumBetBnb < 0.001 || state.minimumBetBnb > 100) {
      out.minimumBetBnb = "0.001 to 100 BNB";
    }
    return out;
  }, [state]);

  const canSubmit = Object.keys(errors).length === 0 && !mutation.isPending;

  const submit = () => {
    if (!canSubmit) return;
    mutation.mutate(state);
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-black/70 supports-[backdrop-filter]:backdrop-blur-md",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
          )}
        />
        <DialogPrimitive.Content
          aria-describedby="create-market-dialog-desc"
          className={cn(
            "admin-create-market-dialog fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2",
            "max-h-[90vh] overflow-y-auto rounded-2xl bg-[var(--hub-card)] text-[var(--hub-fg)]",
            "ring-1 ring-[var(--hub-border-strong)] shadow-[0_24px_80px_-24px_rgba(0,0,0,0.75)]",
            "outline-none color-scheme-dark",
          )}
        >
          <header className="flex items-start justify-between gap-3 border-b border-[var(--hub-border)] px-5 py-4">
            <div>
              <DialogPrimitive.Title className="text-[16px] font-semibold tracking-tight text-[var(--hub-fg)]">
                Create Market
              </DialogPrimitive.Title>
              <p
                id="create-market-dialog-desc"
                className="mt-0.5 text-[12px] leading-relaxed text-[var(--hub-muted)]"
              >
                Step 1 saves to the database only. Deploy on-chain from the markets table
                when ready.
              </p>
            </div>
            <DialogPrimitive.Close
              aria-label="Close"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[var(--hub-bg-subtle)] text-[var(--hub-muted)] ring-1 ring-[var(--hub-border)] transition hover:bg-[var(--hub-card-hover)] hover:text-[var(--hub-fg)]"
            >
              <X className="h-3.5 w-3.5" />
            </DialogPrimitive.Close>
          </header>

          {createdId ? (
            <div className="space-y-4 px-5 py-6">
              <div className="flex flex-col items-center gap-3 rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-6 text-center">
                <CheckCircle2 className="h-10 w-10 text-emerald-300" />
                <p className="text-[14px] font-semibold text-emerald-100">
                  Market created in DB. Deploy on-chain to make it tradeable.
                </p>
                <p className="text-[12px] text-emerald-200/80">
                  The listing appears in the table with status{" "}
                  <span className="font-semibold">DB Only: Not Tradeable</span>.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="w-full rounded-xl bg-[var(--hub-primary)] px-3.5 py-2.5 text-[13px] font-bold text-white ring-1 ring-[var(--hub-border-strong)] transition hover:brightness-110"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-4 px-5 py-4">
                <Field label="Question" error={errors.question}>
                  <textarea
                    rows={3}
                    value={state.question}
                    onChange={(e) => setState((s) => ({ ...s, question: e.target.value }))}
                    placeholder="Will DOGE market cap exceed $50B by Dec 31, 2026?"
                    className={cn(adminInputClass, "resize-y leading-relaxed")}
                  />
                </Field>

                <Field label="Category" error={errors.adminCategory}>
                  <select
                    value={state.adminCategory}
                    onChange={(e) =>
                      setState((s) => ({
                        ...s,
                        adminCategory: e.target.value as AdminMarketCategory,
                      }))
                    }
                    className={adminInputClass}
                  >
                    <option value="">Select category…</option>
                    {ADMIN_MARKET_CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field
                  label="Narrative slug"
                  hint='e.g. "meme-coins"'
                  error={errors.narrativeSlug}
                >
                  <input
                    value={state.narrativeSlug}
                    onChange={(e) =>
                      setState((s) => ({ ...s, narrativeSlug: e.target.value }))
                    }
                    placeholder="meme-coins"
                    className={cn(adminInputClass, "font-mono")}
                  />
                </Field>

                <Field
                  label="Resolution Source"
                  hint='e.g. "CoinGecko price at deadline"'
                  error={errors.resolutionSource}
                >
                  <input
                    value={state.resolutionSource}
                    onChange={(e) =>
                      setState((s) => ({ ...s, resolutionSource: e.target.value }))
                    }
                    placeholder="CoinGecko price at deadline"
                    className={adminInputClass}
                  />
                </Field>

                <Field label="Resolution Date" error={errors.resolutionDate}>
                  <input
                    type="datetime-local"
                    value={state.resolutionDate}
                    onChange={(e) =>
                      setState((s) => ({ ...s, resolutionDate: e.target.value }))
                    }
                    className={cn(adminInputClass, "font-mono")}
                  />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Creator Reward %"
                    hint="Default from Platform Config"
                    error={errors.creatorRewardPercent}
                  >
                    <input
                      type="number"
                      min={0}
                      max={20}
                      step={0.5}
                      value={state.creatorRewardPercent}
                      onChange={(e) =>
                        setState((s) => ({
                          ...s,
                          creatorRewardPercent: Number.parseFloat(e.target.value || "0"),
                        }))
                      }
                      className={cn(adminInputClass, "font-mono tabular-nums")}
                    />
                  </Field>

                  <Field label="Minimum Bet (BNB)" error={errors.minimumBetBnb}>
                    <input
                      type="number"
                      min={0.001}
                      max={100}
                      step={0.001}
                      value={state.minimumBetBnb}
                      onChange={(e) =>
                        setState((s) => ({
                          ...s,
                          minimumBetBnb: Number.parseFloat(e.target.value || "0"),
                        }))
                      }
                      className={cn(adminInputClass, "font-mono tabular-nums")}
                    />
                  </Field>
                </div>
              </div>

              <footer className="flex items-center justify-end gap-2 border-t border-[var(--hub-border)] px-5 py-3">
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="rounded-xl bg-[var(--hub-bg-subtle)] px-3 py-2 text-[12.5px] font-semibold text-[var(--hub-fg)] ring-1 ring-[var(--hub-border)] transition hover:bg-[var(--hub-card-hover)]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!canSubmit}
                  onClick={submit}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--hub-primary)] px-3.5 py-2 text-[12.5px] font-bold text-white ring-1 ring-[var(--hub-border-strong)] transition hover:brightness-110 disabled:opacity-40"
                >
                  {mutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Plus className="h-3.5 w-3.5" />
                  )}
                  Create Market
                </button>
              </footer>
            </>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="admin-field-label mb-1.5 block">{label}</span>
      {children}
      <div className="mt-1.5 flex items-start justify-between gap-2">
        {hint ? <p className="admin-field-hint">{hint}</p> : <span />}
        {error ? (
          <p className="shrink-0 text-[11px] font-semibold text-rose-400">{error}</p>
        ) : null}
      </div>
    </label>
  );
}
