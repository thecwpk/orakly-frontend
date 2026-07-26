"use client";

import { Sparkles } from "lucide-react";
import { useCreateMarketStore } from "@/features/markets/store/use-create-market-store";
import { MARKET_CATEGORIES } from "@/features/markets/lib/categories";
import { cn } from "@/lib/utils";
import { WizardField, wizardInputClass } from "./wizard-field";
import type { CreateMarketDraft } from "@/features/markets/store/use-create-market-store";
import { suggestSlug } from "../lib/validate-step";

const accentChipMap: Record<string, string> = {
  cyan: "data-[selected=true]:bg-cyan-500/15 data-[selected=true]:text-cyan-100 data-[selected=true]:ring-cyan-400/40",
  violet:
    "data-[selected=true]:bg-violet-500/15 data-[selected=true]:text-violet-100 data-[selected=true]:ring-violet-400/40",
  emerald:
    "data-[selected=true]:bg-emerald-500/15 data-[selected=true]:text-emerald-100 data-[selected=true]:ring-emerald-400/40",
  sky: "data-[selected=true]:bg-sky-500/15 data-[selected=true]:text-sky-100 data-[selected=true]:ring-sky-400/40",
  rose: "data-[selected=true]:bg-rose-500/15 data-[selected=true]:text-rose-100 data-[selected=true]:ring-rose-400/40",
  amber:
    "data-[selected=true]:bg-amber-500/15 data-[selected=true]:text-amber-100 data-[selected=true]:ring-amber-400/40",
  fuchsia:
    "data-[selected=true]:bg-fuchsia-500/15 data-[selected=true]:text-fuchsia-100 data-[selected=true]:ring-fuchsia-400/40",
};

export function StepBasics({
  errors,
}: {
  errors: Partial<Record<keyof CreateMarketDraft, string>>;
}) {
  const draft = useCreateMarketStore((s) => s.draft);
  const setField = useCreateMarketStore((s) => s.setField);
  const patch = useCreateMarketStore((s) => s.patch);

  return (
    <div className="space-y-5">
      <WizardField
        label="Question"
        hint="Phrase the YES outcome unambiguously, ending with a question mark."
        error={errors.title}
      >
        <input
          aria-invalid={Boolean(errors.title)}
          value={draft.title}
          onChange={(e) => {
            const title = e.target.value;
            patch({
              title,
              slug: draft.slug ? draft.slug : suggestSlug(title),
            });
          }}
          placeholder="Will BTC close above $120k by Sep 30?"
          className={wizardInputClass}
        />
      </WizardField>

      <div className="grid gap-5 sm:grid-cols-2">
        <WizardField
          label="Slug"
          hint="Used in URLs and APIs."
          error={errors.slug}
          trailing={
            draft.title ? (
              <button
                type="button"
                onClick={() => setField("slug", suggestSlug(draft.title))}
                className="inline-flex items-center gap-1 rounded-md bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)] px-2 py-0.5 text-[10px] font-medium text-[var(--foreground)]/80 ring-1 ring-[var(--border)] transition hover:bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]"
              >
                <Sparkles className="h-3 w-3" />
                Auto
              </button>
            ) : null
          }
        >
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-[11px] text-[var(--foreground-muted)]">
              /markets/
            </span>
            <input
              aria-invalid={Boolean(errors.slug)}
              value={draft.slug}
              onChange={(e) => setField("slug", e.target.value)}
              placeholder="btc-120k-sep30"
              className={cn(wizardInputClass, "pl-[5.25rem] font-mono")}
            />
          </div>
        </WizardField>

        <WizardField
          label="Category"
          hint="Routes liquidity into the right discovery lane."
          error={errors.category}
        >
          <div className="flex flex-wrap gap-1.5">
            {MARKET_CATEGORIES.map((cat) => {
              const selected = draft.category === cat.slug;
              const Icon = cat.icon;
              return (
                <button
                  key={cat.slug}
                  type="button"
                  data-selected={selected}
                  onClick={() => setField("category", cat.slug)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium",
                    "bg-[color-mix(in_srgb,var(--foreground)_4%,transparent)] text-[var(--foreground-muted)] ring-1 ring-[var(--border)] transition",
                    "hover:bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)] hover:text-[var(--foreground)]",
                    accentChipMap[cat.accent],
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {cat.name}
                </button>
              );
            })}
          </div>
        </WizardField>
      </div>

      <WizardField
        label="Context"
        hint="Optional 1 to 2 sentence framing of what this market measures and why."
        error={errors.description}
      >
        <textarea
          aria-invalid={Boolean(errors.description)}
          value={draft.description}
          onChange={(e) => setField("description", e.target.value)}
          rows={3}
          placeholder="Spot price on Coinbase USD pair at 23:59 UTC on Sep 30."
          className={cn(wizardInputClass, "resize-none leading-relaxed")}
        />
      </WizardField>
    </div>
  );
}
