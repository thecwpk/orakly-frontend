"use client";

import { Calendar, Clock } from "lucide-react";
import {
  useCreateMarketStore,
  type CreateMarketDraft,
} from "@/features/markets/store/use-create-market-store";
import { WizardField, wizardInputClass } from "./wizard-field";
import { cn } from "@/lib/utils";

const PRESETS = [
  { label: "1d", days: 1 },
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
] as const;

function toLocalInputValue(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const tz = d.getTimezoneOffset();
  const local = new Date(d.getTime() - tz * 60_000);
  return local.toISOString().slice(0, 16);
}

function fromLocalInputValue(local: string): string {
  if (!local) return "";
  const d = new Date(local);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString();
}

function presetIso(days: number): string {
  const d = new Date(Date.now() + days * 24 * 60 * 60_000);
  return d.toISOString();
}

export function StepTimeline({
  errors,
}: {
  errors: Partial<Record<keyof CreateMarketDraft, string>>;
}) {
  const draft = useCreateMarketStore((s) => s.draft);
  const setField = useCreateMarketStore((s) => s.setField);

  const closesIn = draft.closesAt
    ? Math.max(
        0,
        Math.round((new Date(draft.closesAt).getTime() - Date.now()) / 3600_000),
      )
    : null;

  return (
    <div className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <WizardField
          label="Opens at"
          hint="Leave blank to open immediately on publish."
          error={errors.opensAt}
          trailing={<Clock className="h-3.5 w-3.5 text-zinc-500" />}
        >
          <input
            type="datetime-local"
            value={toLocalInputValue(draft.opensAt)}
            onChange={(e) =>
              setField("opensAt", fromLocalInputValue(e.target.value))
            }
            className={cn(wizardInputClass, "font-mono text-[13px]")}
          />
        </WizardField>

        <WizardField
          label="Closes at"
          hint="Trading halts at this moment in UTC."
          error={errors.closesAt}
          trailing={<Calendar className="h-3.5 w-3.5 text-zinc-500" />}
        >
          <input
            aria-invalid={Boolean(errors.closesAt)}
            type="datetime-local"
            value={toLocalInputValue(draft.closesAt)}
            onChange={(e) =>
              setField("closesAt", fromLocalInputValue(e.target.value))
            }
            className={cn(wizardInputClass, "font-mono text-[13px]")}
          />
        </WizardField>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
          Quick set
        </span>
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => setField("closesAt", presetIso(p.days))}
            className="rounded-lg bg-white/[0.05] px-2.5 py-1 text-[11px] font-medium text-zinc-300 ring-1 ring-white/10 transition hover:bg-cyan-500/10 hover:text-cyan-200 hover:ring-cyan-400/30"
          >
            +{p.label}
          </button>
        ))}
      </div>

      {closesIn !== null ? (
        <div className="flex items-center justify-between rounded-xl bg-white/[0.03] px-3.5 py-2.5 ring-1 ring-white/10">
          <span className="text-[11px] uppercase tracking-wider text-zinc-500">
            Window
          </span>
          <span className="font-mono text-[12px] text-zinc-200">
            ~ {closesIn.toLocaleString()}h until close
          </span>
        </div>
      ) : null}
    </div>
  );
}
