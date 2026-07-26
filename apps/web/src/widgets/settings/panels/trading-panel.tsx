"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  SettingsPanel,
  SettingsRow,
  SettingsToggle,
} from "../components/settings-panel";
import { wizardInputClass } from "@/widgets/market-create/components/wizard-field";

const SLIPPAGE_PRESETS = [0.1, 0.5, 1.0, 2.0] as const;

export function TradingSettingsPanel() {
  const [defaultSide, setDefaultSide] = useState<"YES" | "NO">("YES");
  const [slippagePct, setSlippagePct] = useState<number>(0.5);
  const [confirmTrades, setConfirmTrades] = useState(true);
  const [hotkeysEnabled, setHotkeysEnabled] = useState(true);

  return (
    <SettingsPanel
      title="Trading"
      description="Defaults applied to the trading desk and quote panel."
    >
      <SettingsRow
        label="Default outcome"
        hint="Pre-selected on the trading desk for new markets."
      >
        <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-[color-mix(in_srgb,var(--foreground)_5%,transparent)] p-1 ring-1 ring-[var(--border)]">
          {(["YES", "NO"] as const).map((side) => (
            <button
              key={side}
              type="button"
              onClick={() => setDefaultSide(side)}
              className={cn(
                "rounded-lg px-3 py-2 text-[12px] font-semibold transition",
                defaultSide === side
                  ? side === "YES"
                    ? "bg-cyan-500/15 text-cyan-100 ring-1 ring-cyan-400/30"
                    : "bg-violet-500/15 text-violet-100 ring-1 ring-violet-400/30"
                  : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]",
              )}
            >
              {side}
            </button>
          ))}
        </div>
      </SettingsRow>

      <SettingsRow label="Max slippage" hint="Quote breakers in basis points.">
        <div className="flex flex-wrap gap-1.5">
          {SLIPPAGE_PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setSlippagePct(p)}
              className={cn(
                "rounded-lg px-2.5 py-1.5 text-[11px] font-medium ring-1 transition",
                slippagePct === p
                  ? "bg-cyan-500/15 text-cyan-100 ring-cyan-400/40"
                  : "bg-[color-mix(in_srgb,var(--foreground)_4%,transparent)] text-[var(--foreground)]/80 ring-[var(--border)] hover:bg-[color-mix(in_srgb,var(--foreground)_5%,transparent)]",
              )}
            >
              {p}%
            </button>
          ))}
          <input
            type="number"
            min={0.05}
            max={10}
            step={0.05}
            value={slippagePct}
            onChange={(e) => setSlippagePct(Number(e.target.value))}
            className={cn(wizardInputClass, "max-w-[110px] font-mono tabular-nums")}
          />
        </div>
      </SettingsRow>

      <SettingsRow
        label="Confirm before trade"
        hint="Show a confirmation modal for every order. Off = instant submit."
      >
        <div className="flex items-center justify-between gap-3 rounded-xl bg-[color-mix(in_srgb,var(--foreground)_5%,transparent)] px-3 py-2.5 ring-1 ring-[var(--border)]">
          <span className="text-[12px] text-[var(--foreground)]/80">Confirmation modal</span>
          <SettingsToggle
            checked={confirmTrades}
            onChange={setConfirmTrades}
            label="Confirm before trade"
          />
        </div>
      </SettingsRow>

      <SettingsRow
        label="Hotkeys"
        hint="Keyboard shortcuts on the trading desk (B = buy, S = sell, Y/N = side)."
      >
        <div className="flex items-center justify-between gap-3 rounded-xl bg-[color-mix(in_srgb,var(--foreground)_5%,transparent)] px-3 py-2.5 ring-1 ring-[var(--border)]">
          <span className="text-[12px] text-[var(--foreground)]/80">Enable hotkeys</span>
          <SettingsToggle
            checked={hotkeysEnabled}
            onChange={setHotkeysEnabled}
            label="Enable hotkeys"
          />
        </div>
      </SettingsRow>
    </SettingsPanel>
  );
}
