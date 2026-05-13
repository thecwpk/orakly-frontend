"use client";

import { Bot, FileText, Globe2, ShieldCheck, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  RESOLUTION_SOURCES,
  type ResolutionSource,
} from "@/api/schemas/create-market";
import {
  useCreateMarketStore,
  type CreateMarketDraft,
} from "@/features/markets/store/use-create-market-store";
import { WizardField, wizardInputClass } from "./wizard-field";

const SOURCE_META: Record<
  ResolutionSource,
  { label: string; blurb: string; icon: LucideIcon; accent: string }
> = {
  ORACLE: {
    label: "Oracle",
    blurb: "Resolve from an on-chain oracle (Pyth, Chainlink, internal).",
    icon: Bot,
    accent: "ring-cyan-400/40 bg-cyan-500/10 text-cyan-100",
  },
  OFFICIAL: {
    label: "Official source",
    blurb: "Resolve from a single authoritative public source.",
    icon: ShieldCheck,
    accent: "ring-violet-400/40 bg-violet-500/10 text-violet-100",
  },
  COMMUNITY: {
    label: "Community vote",
    blurb: "Resolve via stake-weighted holder vote with dispute window.",
    icon: Globe2,
    accent: "ring-emerald-400/40 bg-emerald-500/10 text-emerald-100",
  },
  MANUAL: {
    label: "Manual review",
    blurb: "Operator confirms the outcome based on resolver notes.",
    icon: FileText,
    accent: "ring-amber-400/40 bg-amber-500/10 text-amber-100",
  },
};

export function StepResolution({
  errors,
}: {
  errors: Partial<Record<keyof CreateMarketDraft, string>>;
}) {
  const draft = useCreateMarketStore((s) => s.draft);
  const setField = useCreateMarketStore((s) => s.setField);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
          Resolution source
        </p>
        <p className="mt-1 text-[12px] text-zinc-500">
          Decide how the YES outcome is determined when the market closes.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {RESOLUTION_SOURCES.map((src) => {
            const meta = SOURCE_META[src];
            const Icon = meta.icon;
            const selected = draft.source === src;
            return (
              <button
                key={src}
                type="button"
                onClick={() => setField("source", src)}
                className={cn(
                  "group flex items-start gap-3 rounded-xl px-3 py-3 text-left transition",
                  "ring-1 ring-white/10 bg-white/[0.03] hover:bg-white/[0.06]",
                  selected && cn("bg-white/[0.07]", meta.accent),
                )}
                aria-pressed={selected}
              >
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1",
                    selected
                      ? meta.accent
                      : "bg-white/[0.06] text-zinc-400 ring-white/10",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "text-[13px] font-semibold tracking-tight",
                      selected ? "text-white" : "text-zinc-200",
                    )}
                  >
                    {meta.label}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-snug text-zinc-500">
                    {meta.blurb}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <WizardField
        label="Source URL"
        hint="Public link the resolver will reference. HTTPS only."
        error={errors.sourceUrl}
      >
        <input
          aria-invalid={Boolean(errors.sourceUrl)}
          value={draft.sourceUrl}
          onChange={(e) => setField("sourceUrl", e.target.value)}
          placeholder="https://www.coingecko.com/en/coins/bitcoin"
          className={wizardInputClass}
          inputMode="url"
        />
      </WizardField>

      <WizardField
        label="Resolver note"
        hint="Tie-breaker / interpretation guidance for ambiguous outcomes."
        error={errors.resolverNote}
      >
        <textarea
          value={draft.resolverNote}
          onChange={(e) => setField("resolverNote", e.target.value)}
          rows={2}
          placeholder="If exchange is offline at close, fall back to the next 5-minute candle."
          className={cn(wizardInputClass, "resize-none leading-relaxed")}
        />
      </WizardField>
    </div>
  );
}
