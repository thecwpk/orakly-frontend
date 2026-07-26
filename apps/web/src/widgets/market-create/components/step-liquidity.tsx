"use client";

import { formatCompactUsd } from "@orakly/utils";
import { Droplet, Percent } from "lucide-react";
import {
  useCreateMarketStore,
  type CreateMarketDraft,
} from "@/features/markets/store/use-create-market-store";
import { WizardField, wizardInputClass } from "./wizard-field";
import { cn } from "@/lib/utils";

const SEED_PRESETS = [1_000, 5_000, 25_000, 100_000] as const;

export function StepLiquidity({
  errors,
}: {
  errors: Partial<Record<keyof CreateMarketDraft, string>>;
}) {
  const draft = useCreateMarketStore((s) => s.draft);
  const setField = useCreateMarketStore((s) => s.setField);

  const yesPct = Math.round(draft.initialProbability * 100);
  const noPct = 100 - yesPct;

  return (
    <div className="space-y-6">
      <WizardField
        label="Liquidity seed (USD)"
        hint="Initial USDC the wizard locks to bootstrap the order book."
        error={errors.liquiditySeedUsd}
        trailing={<Droplet className="h-3.5 w-3.5 text-cyan-400/80" />}
      >
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[180px]">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-[var(--foreground-muted)]">
              $
            </span>
            <input
              aria-invalid={Boolean(errors.liquiditySeedUsd)}
              type="number"
              inputMode="decimal"
              min={100}
              step={100}
              value={Number.isFinite(draft.liquiditySeedUsd) ? draft.liquiditySeedUsd : ""}
              onChange={(e) =>
                setField("liquiditySeedUsd", Number(e.target.value || 0))
              }
              className={cn(wizardInputClass, "pl-6 font-mono tabular-nums")}
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {SEED_PRESETS.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setField("liquiditySeedUsd", v)}
                className={cn(
                  "rounded-lg px-2.5 py-1.5 text-[11px] font-medium ring-1 transition",
                  draft.liquiditySeedUsd === v
                    ? "bg-cyan-500/15 text-cyan-100 ring-cyan-400/40"
                    : "bg-[color-mix(in_srgb,var(--foreground)_5%,transparent)] text-[var(--foreground)]/80 ring-[var(--border)] hover:bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]",
                )}
              >
                {formatCompactUsd(v)}
              </button>
            ))}
          </div>
        </div>
      </WizardField>

      <WizardField
        label="Initial probability"
        hint="Implied odds before the first taker hits the book."
        error={errors.initialProbability}
        trailing={<Percent className="h-3.5 w-3.5 text-cyan-400/80" />}
      >
        <div className="space-y-2.5">
          <div className="flex items-center gap-3">
            <input
              aria-invalid={Boolean(errors.initialProbability)}
              type="range"
              min={1}
              max={99}
              value={yesPct}
              onChange={(e) =>
                setField("initialProbability", Number(e.target.value) / 100)
              }
              className="orakly-range w-full"
            />
            <span className="w-14 text-right font-mono text-[13px] tabular-nums text-cyan-200">
              {yesPct}%
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <div className="rounded-lg bg-cyan-500/10 px-3 py-2 ring-1 ring-cyan-400/25">
              <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-200/70">
                YES
              </p>
              <p className="mt-0.5 font-mono text-[18px] font-semibold text-cyan-50">
                {yesPct}¢
              </p>
            </div>
            <div className="rounded-lg bg-violet-500/10 px-3 py-2 ring-1 ring-violet-400/25">
              <p className="text-[10px] font-bold uppercase tracking-widest text-violet-200/70">
                NO
              </p>
              <p className="mt-0.5 font-mono text-[18px] font-semibold text-violet-50">
                {noPct}¢
              </p>
            </div>
          </div>
        </div>
      </WizardField>

      <WizardField
        label="Taker fee (bps)"
        hint="Fee charged on takers, in basis points. 25 bps = 0.25%."
        error={errors.takerFeeBps}
      >
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={0}
            max={500}
            step={5}
            value={draft.takerFeeBps}
            onChange={(e) =>
              setField("takerFeeBps", Number(e.target.value || 0))
            }
            className={cn(wizardInputClass, "max-w-[140px] font-mono tabular-nums")}
          />
          <span className="font-mono text-[12px] text-[var(--foreground-muted)]">
            ≈ {(draft.takerFeeBps / 100).toFixed(2)}%
          </span>
        </div>
      </WizardField>
    </div>
  );
}
