"use client";

import { Check } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  WIZARD_STEPS,
  type WizardStepId,
  useCreateMarketStore,
} from "@/features/markets/store/use-create-market-store";

export function WizardStepper({
  onSelect,
  isStepReachable,
}: {
  onSelect: (i: number) => void;
  isStepReachable: (id: WizardStepId, idx: number) => boolean;
}) {
  const stepIndex = useCreateMarketStore((s) => s.stepIndex);
  const visited = useCreateMarketStore((s) => s.visitedSteps);

  return (
    <ol className="relative grid grid-cols-5 gap-1.5 sm:gap-3">
      {WIZARD_STEPS.map((step, i) => {
        const status: "current" | "complete" | "upcoming" =
          i < stepIndex ? "complete" : i === stepIndex ? "current" : "upcoming";
        const reachable = isStepReachable(step.id, i);
        const wasVisited = visited[step.id];

        return (
          <li key={step.id} className="relative min-w-0">
            <button
              type="button"
              disabled={!reachable}
              onClick={() => onSelect(i)}
              className={cn(
                "group block w-full rounded-lg px-2.5 py-2 text-left transition",
                "ring-1 ring-white/8 hover:bg-white/[0.04]",
                "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent",
                status === "current" && "bg-white/[0.06] ring-cyan-400/40",
              )}
              aria-current={status === "current" ? "step" : undefined}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[10px] tabular-nums ring-1 transition",
                    status === "complete" &&
                      "bg-emerald-500/20 text-emerald-200 ring-emerald-400/40",
                    status === "current" &&
                      "bg-cyan-500/20 text-cyan-100 ring-cyan-400/50",
                    status === "upcoming" &&
                      (wasVisited
                        ? "bg-white/10 text-zinc-300 ring-white/15"
                        : "bg-white/5 text-zinc-500 ring-white/10"),
                  )}
                >
                  {status === "complete" ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    i + 1
                  )}
                </span>
                <div className="min-w-0">
                  <p
                    className={cn(
                      "truncate text-[12px] font-semibold tracking-tight",
                      status === "upcoming" ? "text-zinc-500" : "text-white",
                    )}
                  >
                    {step.label}
                  </p>
                  <p className="hidden truncate text-[10px] text-zinc-600 sm:block">
                    {step.hint}
                  </p>
                </div>
              </div>

              {status === "current" ? (
                <motion.span
                  layoutId="wizard-step-indicator"
                  className="mt-2 block h-0.5 w-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-400"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              ) : (
                <span className="mt-2 block h-0.5 w-full rounded-full bg-white/[0.04]" />
              )}
            </button>
          </li>
        );
      })}
    </ol>
  );
}
