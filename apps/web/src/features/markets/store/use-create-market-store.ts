"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ResolutionSource } from "@/api/schemas/create-market";

export type WizardStepId =
  | "basics"
  | "resolution"
  | "timeline"
  | "liquidity"
  | "preview";

export const WIZARD_STEPS: readonly {
  id: WizardStepId;
  label: string;
  hint: string;
}[] = [
  { id: "basics", label: "Basics", hint: "Title, category, slug." },
  { id: "resolution", label: "Resolution", hint: "How is YES decided?" },
  { id: "timeline", label: "Timeline", hint: "Open and close windows." },
  { id: "liquidity", label: "Liquidity", hint: "Seed, fee, starting odds." },
  { id: "preview", label: "Preview", hint: "Confirm and publish." },
] as const;

export type CreateMarketDraft = {
  title: string;
  slug: string;
  category: string;
  description: string;
  source: ResolutionSource;
  sourceUrl: string;
  resolverNote: string;
  opensAt: string;
  closesAt: string;
  liquiditySeedUsd: number;
  initialProbability: number;
  takerFeeBps: number;
};

const EMPTY_DRAFT: CreateMarketDraft = {
  title: "",
  slug: "",
  category: "crypto",
  description: "",
  source: "ORACLE",
  sourceUrl: "",
  resolverNote: "",
  opensAt: "",
  closesAt: "",
  liquiditySeedUsd: 5_000,
  initialProbability: 0.5,
  takerFeeBps: 25,
};

type CreateMarketStore = {
  draft: CreateMarketDraft;
  stepIndex: number;
  visitedSteps: Record<WizardStepId, boolean>;
  setField: <K extends keyof CreateMarketDraft>(
    key: K,
    value: CreateMarketDraft[K],
  ) => void;
  patch: (patch: Partial<CreateMarketDraft>) => void;
  setStepIndex: (i: number) => void;
  next: () => void;
  prev: () => void;
  markVisited: (id: WizardStepId) => void;
  reset: () => void;
};

export const useCreateMarketStore = create<CreateMarketStore>()(
  persist(
    (set, get) => ({
      draft: EMPTY_DRAFT,
      stepIndex: 0,
      visitedSteps: {
        basics: false,
        resolution: false,
        timeline: false,
        liquidity: false,
        preview: false,
      },
      setField: (key, value) =>
        set((s) => ({ draft: { ...s.draft, [key]: value } })),
      patch: (patch) => set((s) => ({ draft: { ...s.draft, ...patch } })),
      setStepIndex: (i) =>
        set({
          stepIndex: Math.max(0, Math.min(WIZARD_STEPS.length - 1, i)),
        }),
      next: () => {
        const i = get().stepIndex;
        if (i < WIZARD_STEPS.length - 1) set({ stepIndex: i + 1 });
      },
      prev: () => {
        const i = get().stepIndex;
        if (i > 0) set({ stepIndex: i - 1 });
      },
      markVisited: (id) =>
        set((s) => ({ visitedSteps: { ...s.visitedSteps, [id]: true } })),
      reset: () =>
        set({
          draft: EMPTY_DRAFT,
          stepIndex: 0,
          visitedSteps: {
            basics: false,
            resolution: false,
            timeline: false,
            liquidity: false,
            preview: false,
          },
        }),
    }),
    {
      name: "orakly:create-market-draft",
      version: 1,
      partialize: (state) => ({
        draft: state.draft,
        stepIndex: state.stepIndex,
        visitedSteps: state.visitedSteps,
      }),
    },
  ),
);

export function selectDraft(s: CreateMarketStore) {
  return s.draft;
}
