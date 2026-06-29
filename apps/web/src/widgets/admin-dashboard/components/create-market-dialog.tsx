"use client";

import { Dialog as DialogPrimitive } from "radix-ui";
import { formatCompactUsd } from "@orakly/utils";
import { motion } from "framer-motion";
import { BookOpen, Droplet, Loader2, Plus, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAccount, useChainId } from "wagmi";
import { useDeployOnChainMarket } from "@/features/chain-trading/hooks/use-deploy-on-chain-market";
import { isChainEnvConfigured, chainEnvConfigErrorMessage } from "@/features/chain-trading/lib/chain-contract-env";
import { narrativeToChainCategory } from "@/features/chain-trading/lib/narrative-to-chain-category";
import { testBnbChain } from "@/providers/web3/chains";
import { cn } from "@/lib/utils";
import { adminApi } from "../lib/admin-api";
import {
  ADMIN_MARKET_TEMPLATES,
  ADMIN_NARRATIVE_OPTIONS,
  defaultClosesAtLocal,
  findCategoryIdForSlug,
  LIQUIDITY_SEED_PRESETS,
  type AdminNarrativeKey,
} from "../lib/admin-market-create-presets";
import {
  adminMarketsKey,
  adminOverviewKey,
  type AdminCategoryRow,
} from "../hooks/use-admin-queries";

type CreateState = {
  narrative: AdminNarrativeKey | "";
  title: string;
  slug: string;
  description: string;
  categoryId: string;
  closesAt: string;
  takerFeeBps: number;
  liquidityUsd: number;
  initialProbability: number;
  publishOpen: boolean;
};

const DEFAULT_STATE: CreateState = {
  narrative: "",
  title: "",
  slug: "",
  description: "",
  categoryId: "",
  closesAt: defaultClosesAtLocal(90),
  takerFeeBps: 25,
  liquidityUsd: 25_000,
  initialProbability: 0.5,
  publishOpen: true,
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

const adminInputClass = cn(
  "admin-field-input w-full rounded-xl px-3 py-2.5 text-[13px] outline-none",
  "border border-[var(--hub-border-strong)] bg-[var(--hub-bg-subtle)] text-[var(--hub-fg)]",
  "placeholder:text-[var(--hub-muted)]",
  "focus:border-[var(--hub-primary)]/55 focus:ring-2 focus:ring-[var(--hub-primary)]/20",
);

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
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setState(DEFAULT_STATE);
      setAutoSlug(true);
      setActiveTemplateId(null);
    }
  }, [open]);

  const qc = useQueryClient();
  const { address } = useAccount();
  const chainId = useChainId();
  const deployOnChain = useDeployOnChainMarket();
  const [deployPhase, setDeployPhase] = useState<"idle" | "deploying" | "saving">("idle");

  const selectedNarrative = useMemo(
    () => ADMIN_NARRATIVE_OPTIONS.find((n) => n.key === state.narrative),
    [state.narrative],
  );

  const mutation = useMutation({
    mutationFn: async (s: CreateState & { onChainAddress?: string; chainId?: number }) =>
      adminApi("/markets", {
        method: "POST",
        json: {
          title: s.title.trim(),
          slug: s.slug.trim(),
          description: s.description.trim() || undefined,
          narrative: s.narrative || undefined,
          closesAt: new Date(s.closesAt).toISOString(),
          takerFeeBps: s.takerFeeBps,
          liquidityUsd: s.liquidityUsd,
          initialProbability: s.initialProbability,
          status: s.publishOpen ? "OPEN" : "DRAFT",
          onChainAddress: s.onChainAddress ?? null,
          chainId: s.chainId ?? null,
          ...(s.categoryId ? { categoryId: s.categoryId } : {}),
        },
      }),
    onSuccess: (_data, variables) => {
      toast.success(
        variables.publishOpen
          ? "Market deployed on-chain and published"
          : "Market draft created",
      );
      setDeployPhase("idle");
      void qc.invalidateQueries({ queryKey: ["admin", "markets"] });
      void qc.invalidateQueries({ queryKey: adminMarketsKey("ALL", 120) });
      void qc.invalidateQueries({ queryKey: adminOverviewKey });
      onOpenChange(false);
    },
    onError: (e: unknown) => {
      setDeployPhase("idle");
      toast.error(e instanceof Error ? e.message : "Create failed");
    },
  });

  const errors = useMemo(() => {
    const out: Partial<Record<keyof CreateState, string>> = {};
    if (!state.narrative) out.narrative = "Pick a narrative lane";
    if (state.title.trim().length < 4) out.title = "At least 4 characters";
    if (state.slug.trim().length < 2) out.slug = "At least 2 characters";
    if (!isFutureDate(state.closesAt)) out.closesAt = "Must be in the future";
    if (state.takerFeeBps < 0 || state.takerFeeBps > 500) {
      out.takerFeeBps = "0–500 bps";
    } else if (state.publishOpen && state.takerFeeBps > 200) {
      out.takerFeeBps = "On-chain markets max 200 bps (2%)";
    }
    if (state.liquidityUsd < 100 || state.liquidityUsd > 10_000_000) {
      out.liquidityUsd = "$100 – $10M";
    }
    if (state.initialProbability < 0.01 || state.initialProbability > 0.99) {
      out.initialProbability = "1% – 99%";
    }
    return out;
  }, [state]);

  const isBusy = mutation.isPending || deployOnChain.isPending || deployPhase !== "idle";
  const canSubmit = Object.keys(errors).length === 0 && !isBusy;

  const yesPct = Math.round(state.initialProbability * 100);
  const noPct = 100 - yesPct;

  const applyTemplate = (templateId: string) => {
    const tpl = ADMIN_MARKET_TEMPLATES.find((t) => t.id === templateId);
    if (!tpl) return;
    setActiveTemplateId(templateId);
    setAutoSlug(true);
    setState({
      narrative: tpl.narrative,
      title: tpl.title,
      slug: tpl.slug,
      description: tpl.description,
      categoryId: findCategoryIdForSlug(categories, tpl.categorySlug),
      closesAt: defaultClosesAtLocal(tpl.closesInDays),
      takerFeeBps: tpl.takerFeeBps,
      liquidityUsd: tpl.liquiditySeedUsd,
      initialProbability: tpl.initialProbability,
      publishOpen: true,
    });
  };

  const onNarrativeChange = (key: AdminNarrativeKey) => {
    const option = ADMIN_NARRATIVE_OPTIONS.find((n) => n.key === key);
    if (!option) return;
    setState((s) => ({
      ...s,
      narrative: key,
      categoryId:
        s.categoryId || findCategoryIdForSlug(categories, option.categorySlug),
      title: s.title || option.exampleTitle,
      slug: s.slug || (autoSlug ? slugify(option.exampleTitle) : s.slug),
    }));
  };

  const onTitleChange = (v: string) => {
    setActiveTemplateId(null);
    setState((s) => ({ ...s, title: v, slug: autoSlug ? slugify(v) : s.slug }));
  };

  const submit = async () => {
    if (!canSubmit) return;

    if (!state.publishOpen) {
      mutation.mutate(state);
      return;
    }

    if (!address) {
      toast.error("Connect the factory-owner wallet in MetaMask to deploy markets.");
      return;
    }
    if (chainId !== testBnbChain.id) {
      toast.error("Switch MetaMask to BNB Smart Chain Testnet (chain 97).");
      return;
    }
    if (!isChainEnvConfigured()) {
      toast.error(chainEnvConfigErrorMessage() || "On-chain env missing.");
      return;
    }

    try {
      setDeployPhase("deploying");
      const endTimeUnix = Math.floor(new Date(state.closesAt).getTime() / 1000);
      const deployed = await deployOnChain.mutateAsync({
        question: state.title.trim(),
        resolutionSource:
          state.description.trim() ||
          "Resolves per admin resolution rules in the Orakly hub listing.",
        category: narrativeToChainCategory(state.narrative),
        endTimeUnix,
        seedLiquidityUsd: "100",
        assertionRewardUsd: "5",
        requiredBondUsd: "1",
        feeBps: Math.min(state.takerFeeBps, 200),
      });

      setDeployPhase("saving");
      mutation.mutate({
        ...state,
        onChainAddress: deployed.marketAddress,
        chainId: deployed.chainId,
      });
    } catch (e) {
      setDeployPhase("idle");
      if (e instanceof Error && !deployOnChain.isError) {
        toast.error(e.message);
      }
    }
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
            "admin-create-market-dialog fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2",
            "max-h-[90vh] overflow-y-auto rounded-2xl bg-[var(--hub-card)] text-[var(--hub-fg)]",
            "ring-1 ring-[var(--hub-border-strong)] shadow-[0_24px_80px_-24px_rgba(0,0,0,0.75)]",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
            "data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95",
            "outline-none color-scheme-dark",
          )}
        >
          <header className="flex items-start justify-between gap-3 border-b border-[var(--hub-border)] px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-[var(--hub-primary-soft)] text-[var(--hub-primary-bright)] ring-1 ring-[var(--hub-border)]">
                <Sparkles className="h-4 w-4" />
              </span>
              <div>
                <DialogPrimitive.Title className="text-[16px] font-semibold tracking-tight text-[var(--hub-fg)]">
                  Create market
                </DialogPrimitive.Title>
                <p
                  id="create-market-dialog-desc"
                  className="mt-0.5 text-[12px] leading-relaxed text-[var(--hub-muted)]"
                >
                  Publishing deploys a Market.sol contract via MetaMask, then saves the
                  listing with its on-chain address. Drafts stay off-chain until you publish.
                </p>
              </div>
            </div>
            <DialogPrimitive.Close
              aria-label="Close"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[var(--hub-bg-subtle)] text-[var(--hub-muted)] ring-1 ring-[var(--hub-border)] transition hover:bg-[var(--hub-card-hover)] hover:text-[var(--hub-fg)]"
            >
              <X className="h-3.5 w-3.5" />
            </DialogPrimitive.Close>
          </header>

          <div className="space-y-5 px-5 py-4">
            <section className="rounded-xl border border-[var(--hub-border)] bg-[var(--hub-bg-subtle)]/60 p-3.5">
              <p className="admin-field-label mb-2">Quick start from example</p>
              <div className="flex flex-wrap gap-2">
                {ADMIN_MARKET_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => applyTemplate(tpl.id)}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-[12px] font-medium ring-1 transition",
                      activeTemplateId === tpl.id
                        ? "bg-[var(--hub-primary-soft)] text-[var(--hub-primary-bright)] ring-[var(--hub-border-strong)]"
                        : "bg-[var(--hub-card)] text-[var(--hub-fg)] ring-[var(--hub-border)] hover:bg-[var(--hub-card-hover)]",
                    )}
                  >
                    {tpl.label}
                  </button>
                ))}
              </div>
              <p className="admin-field-hint mt-2">
                Templates pre-fill question, resolution copy, narrative, liquidity, and
                opening odds — edit anything before publishing.
              </p>
            </section>

            <Field
              label="Narrative lane"
              hint="Routes the market into hub attention chips and discovery filters."
              error={errors.narrative}
            >
              <select
                value={state.narrative}
                onChange={(e) => onNarrativeChange(e.target.value as AdminNarrativeKey)}
                className={adminInputClass}
              >
                <option value="">Select narrative…</option>
                {ADMIN_NARRATIVE_OPTIONS.map((n) => (
                  <option key={n.key} value={n.key}>
                    {n.label}
                  </option>
                ))}
              </select>
              {selectedNarrative ? (
                <div className="mt-2 rounded-lg border border-[var(--hub-border)] bg-[var(--hub-card)] px-3 py-2">
                  <p className="text-[12px] leading-relaxed text-[var(--hub-fg)]">
                    <BookOpen className="mr-1.5 inline h-3.5 w-3.5 text-[var(--hub-primary-bright)]" />
                    {selectedNarrative.description}
                  </p>
                  <p className="admin-field-hint mt-1.5">
                    Example question:{" "}
                    <span className="text-[var(--hub-fg)]">{selectedNarrative.exampleTitle}</span>
                  </p>
                </div>
              ) : null}
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Question" hint="Phrase the YES outcome clearly." error={errors.title}>
                <input
                  value={state.title}
                  onChange={(e) => onTitleChange(e.target.value)}
                  placeholder="Will BTC close above $100k by year-end?"
                  className={adminInputClass}
                />
              </Field>

              <Field
                label="Slug"
                hint="Used in URLs — lowercase and dashes only."
                error={errors.slug}
                right={
                  <button
                    type="button"
                    onClick={() => setAutoSlug((s) => !s)}
                    className="text-[11px] font-semibold text-[var(--hub-primary-bright)] hover:underline"
                  >
                    {autoSlug ? "Edit manually" : "Auto from title"}
                  </button>
                }
              >
                <input
                  value={state.slug}
                  disabled={autoSlug}
                  onChange={(e) => setState((s) => ({ ...s, slug: e.target.value }))}
                  placeholder="btc-100k-eoy"
                  className={cn(adminInputClass, "font-mono disabled:opacity-65")}
                />
              </Field>
            </div>

            <Field
              label="Resolution rules"
              hint="What data source and condition resolve YES vs NO?"
              error={undefined}
            >
              <textarea
                rows={4}
                value={state.description}
                onChange={(e) => setState((s) => ({ ...s, description: e.target.value }))}
                placeholder="Resolves YES if Coinbase BTC-USD daily close ≥ $100,000 on 2026-12-31 UTC. Otherwise NO."
                className={cn(adminInputClass, "resize-y leading-relaxed")}
              />
            </Field>

            <section className="rounded-xl border border-[var(--hub-border)] p-3.5">
              <div className="mb-3 flex items-center gap-2">
                <Droplet className="h-4 w-4 text-[var(--hub-primary-bright)]" />
                <p className="admin-field-label">Liquidity & opening odds</p>
              </div>

              <Field
                label="Liquidity seed (USD)"
                hint="Bootstraps the order book — higher seed = tighter spreads."
                error={errors.liquidityUsd}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative min-w-[140px] flex-1">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-[var(--hub-muted)]">
                      $
                    </span>
                    <input
                      type="number"
                      min={100}
                      step={500}
                      value={state.liquidityUsd}
                      onChange={(e) =>
                        setState((s) => ({
                          ...s,
                          liquidityUsd: Number.parseInt(e.target.value || "0", 10),
                        }))
                      }
                      className={cn(adminInputClass, "pl-6 font-mono tabular-nums")}
                    />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {LIQUIDITY_SEED_PRESETS.map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setState((s) => ({ ...s, liquidityUsd: v }))}
                        className={cn(
                          "rounded-lg px-2.5 py-1.5 text-[11px] font-medium ring-1 transition",
                          state.liquidityUsd === v
                            ? "bg-[var(--hub-primary-soft)] text-[var(--hub-primary-bright)] ring-[var(--hub-border-strong)]"
                            : "bg-[var(--hub-bg-subtle)] text-[var(--hub-fg)] ring-[var(--hub-border)] hover:bg-[var(--hub-card-hover)]",
                        )}
                      >
                        {formatCompactUsd(v)}
                      </button>
                    ))}
                  </div>
                </div>
              </Field>

              <Field
                label="Opening YES probability"
                hint="Starting implied odds before the first trade."
                error={errors.initialProbability}
                className="mt-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={1}
                      max={99}
                      value={yesPct}
                      onChange={(e) =>
                        setState((s) => ({
                          ...s,
                          initialProbability: Number(e.target.value) / 100,
                        }))
                      }
                      className="orakly-range w-full"
                    />
                    <span className="w-12 text-right font-mono text-[13px] tabular-nums text-[var(--hub-primary-bright)]">
                      {yesPct}%
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg border border-[var(--hub-border)] bg-[var(--hub-bg-subtle)] px-3 py-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--hub-muted)]">
                        YES
                      </p>
                      <p className="mt-0.5 font-mono text-[18px] font-semibold text-emerald-300">
                        {yesPct}¢
                      </p>
                    </div>
                    <div className="rounded-lg border border-[var(--hub-border)] bg-[var(--hub-bg-subtle)] px-3 py-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--hub-muted)]">
                        NO
                      </p>
                      <p className="mt-0.5 font-mono text-[18px] font-semibold text-rose-300">
                        {noPct}¢
                      </p>
                    </div>
                  </div>
                </div>
              </Field>

              <Field
                label="Taker fee (bps)"
                hint={
                  state.publishOpen
                    ? `${Math.min(state.takerFeeBps, 200)} bps on-chain (max 200) · trading fees go to treasury`
                    : `${state.takerFeeBps} bps = ${(state.takerFeeBps / 100).toFixed(2)}% per fill`
                }
                error={errors.takerFeeBps}
                className="mt-4"
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
                  className={cn(adminInputClass, "max-w-[160px] font-mono tabular-nums")}
                />
              </Field>
            </section>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Closes at" hint="Trading stops after this time." error={errors.closesAt}>
                <input
                  type="datetime-local"
                  value={state.closesAt}
                  onChange={(e) => setState((s) => ({ ...s, closesAt: e.target.value }))}
                  className={cn(adminInputClass, "font-mono")}
                />
              </Field>

              <Field label="Category" hint="Taxonomy for rails and filters.">
                <select
                  value={state.categoryId}
                  onChange={(e) => setState((s) => ({ ...s, categoryId: e.target.value }))}
                  className={adminInputClass}
                >
                  <option value="">— pick category —</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.slug})
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--hub-border)] bg-[var(--hub-bg-subtle)]/60 px-3.5 py-3">
              <input
                type="checkbox"
                checked={state.publishOpen}
                onChange={(e) =>
                  setState((s) => ({ ...s, publishOpen: e.target.checked }))
                }
                className="mt-0.5 h-4 w-4 rounded border-[var(--hub-border)] accent-[var(--hub-primary)]"
              />
              <span className="text-[12.5px] leading-relaxed text-[var(--hub-fg)]">
                <span className="font-semibold text-[var(--hub-fg)]">
                  Publish immediately (OPEN)
                </span>
                <span className="mt-0.5 block text-[var(--hub-muted)]">
                  When checked, traders can buy/sell right away. Uncheck to save as a private
                  draft.
                </span>
              </span>
            </label>
          </div>

          <footer className="flex flex-col gap-2 border-t border-[var(--hub-border)] px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] leading-relaxed text-[var(--hub-muted)]">
              {state.publishOpen ?
                <>
                  Deploys on BSC testnet via{" "}
                  <span className="font-mono text-[var(--hub-fg)]">MarketFactory</span> ·
                  saves as <span className="font-mono text-[var(--hub-fg)]">OPEN</span>
                </>
              : <>
                  Saves as <span className="font-mono text-[var(--hub-fg)]">DRAFT</span> ·
                  publish from the markets table when ready
                </>
              }
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="rounded-xl bg-[var(--hub-bg-subtle)] px-3 py-2 text-[12.5px] font-semibold text-[var(--hub-fg)] ring-1 ring-[var(--hub-border)] transition hover:bg-[var(--hub-card-hover)]"
              >
                Cancel
              </button>
              <motion.button
                type="button"
                whileTap={{ scale: 0.99 }}
                disabled={!canSubmit}
                onClick={submit}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--hub-primary)] px-3.5 py-2 text-[12.5px] font-bold text-white ring-1 ring-[var(--hub-border-strong)] transition hover:brightness-110 disabled:opacity-40"
              >
                {isBusy ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
                {deployPhase === "deploying"
                  ? "Deploying on-chain…"
                  : deployPhase === "saving"
                    ? "Saving listing…"
                    : state.publishOpen
                      ? "Deploy & publish"
                      : "Save draft"}
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
  className,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  right?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={cn("block", className)}>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="admin-field-label">{label}</span>
        {right}
      </div>
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
