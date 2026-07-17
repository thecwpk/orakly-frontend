"use client";

import type { Market } from "@orakly/types";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Loader2, Trash2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ROUTES } from "@/shared/constants/routes";
import { useCreateMarketMutation } from "@/features/markets/hooks/use-create-market-mutation";
import {
  WIZARD_STEPS,
  useCreateMarketStore,
  type WizardStepId,
  type CreateMarketDraft,
} from "@/features/markets/store/use-create-market-store";
import { useHydrationSafeReducedMotion } from "@/lib/use-hydration-safe-reduced-motion";
import { cn } from "@/lib/utils";
import { StepBasics } from "./components/step-basics";
import { StepLiquidity } from "./components/step-liquidity";
import { StepPreview } from "./components/step-preview";
import { StepResolution } from "./components/step-resolution";
import { StepTimeline } from "./components/step-timeline";
import { SuccessScreen } from "./components/success-screen";
import { SummaryRail } from "./components/summary-rail";
import { WizardStepper } from "./components/wizard-stepper";
import { draftToPayload, validateStep } from "./lib/validate-step";

function computeCompletePct(draft: CreateMarketDraft): number {
  const checks: boolean[] = [
    draft.title.trim().length >= 8,
    draft.slug.trim().length >= 3,
    Boolean(draft.category),
    Boolean(draft.closesAt),
    draft.liquiditySeedUsd >= 100,
    draft.initialProbability > 0 && draft.initialProbability < 1,
    draft.takerFeeBps >= 0 && draft.takerFeeBps <= 500,
  ];
  const passed = checks.filter(Boolean).length;
  return Math.round((passed / checks.length) * 100);
}

export function MarketCreatePage() {
  return (
    <main className="mx-auto max-w-6xl pb-s64 pt-r24 sm:pb-s72 sm:pt-s40">
      <CreateMarketBody />
    </main>
  );
}

function CreateMarketBody() {
  const reduceMotion = useHydrationSafeReducedMotion();

  const draft = useCreateMarketStore((s) => s.draft);
  const stepIndex = useCreateMarketStore((s) => s.stepIndex);
  const setStepIndex = useCreateMarketStore((s) => s.setStepIndex);
  const next = useCreateMarketStore((s) => s.next);
  const prev = useCreateMarketStore((s) => s.prev);
  const reset = useCreateMarketStore((s) => s.reset);
  const markVisited = useCreateMarketStore((s) => s.markVisited);
  const visited = useCreateMarketStore((s) => s.visitedSteps);

  const [errors, setErrors] = useState<
    Partial<Record<keyof CreateMarketDraft, string>>
  >({});
  const [submitted, setSubmitted] = useState<Market | null>(null);
  const [snapshotDraft, setSnapshotDraft] =
    useState<CreateMarketDraft | null>(null);

  const mutation = useCreateMarketMutation();

  const currentStep = WIZARD_STEPS[stepIndex] ?? WIZARD_STEPS[0]!;
  const isLast = stepIndex === WIZARD_STEPS.length - 1;
  const completePct = useMemo(() => computeCompletePct(draft), [draft]);

  const isStepReachable = (id: WizardStepId, idx: number): boolean => {
    if (idx <= stepIndex) return true;
    if (visited[id]) return true;
    for (let i = stepIndex; i < idx; i += 1) {
      const step = WIZARD_STEPS[i];
      if (!step) return false;
      const v = validateStep(step.id, draft);
      if (!v.ok) return false;
    }
    return true;
  };

  const goTo = (idx: number) => {
    if (!isStepReachable(WIZARD_STEPS[idx]!.id, idx)) return;
    setStepIndex(idx);
    setErrors({});
  };

  const handleNext = () => {
    const v = validateStep(currentStep.id, draft);
    if (!v.ok) {
      setErrors(v.errors);
      const first = Object.values(v.errors)[0];
      if (first) toast.error(first);
      return;
    }
    setErrors({});
    markVisited(currentStep.id);
    next();
  };

  const handlePublish = async () => {
    const v = validateStep("preview", draft);
    if (!v.ok) {
      setErrors(v.errors);
      const first = Object.values(v.errors)[0];
      if (first) toast.error(first);
      return;
    }
    try {
      const payload = draftToPayload(draft);
      const snapshot: CreateMarketDraft = { ...draft };
      const created = await mutation.mutateAsync(payload);
      setSnapshotDraft(snapshot);
      setSubmitted(created);
      toast.success("Market submitted. Pending review.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to publish.");
    }
  };

  const handleCreateAnother = () => {
    reset();
    setSubmitted(null);
    setSnapshotDraft(null);
    setErrors({});
  };

  if (submitted && snapshotDraft) {
    return (
      <div className="space-y-6">
        <header className="flex flex-wrap items-center gap-3">
          <Link
            href={ROUTES.discover}
            className="inline-flex items-center gap-2 rounded-full bg-white/[0.05] px-3 py-1.5 text-[12px] font-medium text-zinc-300 ring-1 ring-white/10 transition hover:bg-white/[0.08]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Markets
          </Link>
        </header>
        <SuccessScreen
          market={submitted}
          draft={snapshotDraft}
          onCreateAnother={handleCreateAnother}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={ROUTES.discover}
            className="inline-flex items-center gap-2 rounded-full bg-white/[0.05] px-3 py-1.5 text-[12px] font-medium text-zinc-300 ring-1 ring-white/10 transition hover:bg-white/[0.08]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Markets
          </Link>
          <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-cyan-200 ring-1 ring-cyan-400/30">
            Create market
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            reset();
            setErrors({});
            toast.success("Draft cleared.");
          }}
          className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.03] px-2.5 py-1.5 text-[11px] font-medium text-zinc-400 ring-1 ring-white/[0.08] transition hover:bg-white/[0.08] hover:text-zinc-200"
        >
          <Trash2 className="h-3 w-3" />
          Clear draft
        </button>
      </header>

      <h1 className="text-balance text-2xl font-semibold leading-tight tracking-tight text-white sm:text-3xl">
        Spin up a new prediction pool.
      </h1>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        <section className="glass-panel-strong rounded-2xl p-4 sm:p-5">
          <WizardStepper onSelect={goTo} isStepReachable={isStepReachable} />

          <div className="mt-5 border-t border-white/[0.06] pt-5">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep.id}
                initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >
                {currentStep.id === "basics" && <StepBasics errors={errors} />}
                {currentStep.id === "resolution" && (
                  <StepResolution errors={errors} />
                )}
                {currentStep.id === "timeline" && (
                  <StepTimeline errors={errors} />
                )}
                {currentStep.id === "liquidity" && (
                  <StepLiquidity errors={errors} />
                )}
                {currentStep.id === "preview" && <StepPreview />}
              </motion.div>
            </AnimatePresence>
          </div>

          <footer className="mt-6 flex items-center justify-between gap-3 border-t border-white/[0.06] pt-4">
            <button
              type="button"
              onClick={prev}
              disabled={stepIndex === 0}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg bg-white/[0.04] px-3 py-2 text-[12px] font-medium text-zinc-300 ring-1 ring-white/10 transition",
                "hover:bg-white/[0.08] hover:text-white",
                "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white/[0.04]",
              )}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </button>

            <p className="hidden font-mono text-[10px] uppercase tracking-wider text-zinc-600 sm:block">
              Step {stepIndex + 1} / {WIZARD_STEPS.length}
            </p>

            {isLast ? (
              <button
                type="button"
                onClick={() => void handlePublish()}
                disabled={mutation.isPending}
                className={cn(
                  "neon-edge-cyan inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500/90 to-emerald-500/85 px-4 py-2 text-[13px] font-semibold text-zinc-950 shadow-md shadow-cyan-500/10 transition",
                  "hover:brightness-105 active:scale-[0.99]",
                  "disabled:cursor-wait disabled:opacity-70",
                )}
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Publishing…
                  </>
                ) : (
                  <>
                    Publish market
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-500/90 to-violet-500/85 px-4 py-2 text-[13px] font-semibold text-zinc-950 shadow-md shadow-cyan-500/10 transition hover:brightness-105 active:scale-[0.99]"
              >
                Continue
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </footer>
        </section>

        <SummaryRail completePct={completePct} isReady={completePct === 100} />
      </div>
    </div>
  );
}
