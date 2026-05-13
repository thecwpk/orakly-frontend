"use client";

import { useState } from "react";
import { Moon, Sparkles, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SettingsPanel,
  SettingsRow,
  SettingsToggle,
} from "../components/settings-panel";

type Theme = "dark" | "system" | "light";
type Density = "compact" | "comfortable";

export function AppearanceSettingsPanel() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [density, setDensity] = useState<Density>("compact");
  const [reduceMotion, setReduceMotion] = useState(false);
  const [neonAccents, setNeonAccents] = useState(true);

  const themes: { id: Theme; label: string; icon: typeof Sun }[] = [
    { id: "dark", label: "Dark", icon: Moon },
    { id: "system", label: "System", icon: Sparkles },
    { id: "light", label: "Light", icon: Sun },
  ];

  return (
    <SettingsPanel
      title="Appearance"
      description="Theme, density, and motion preferences."
    >
      <SettingsRow label="Theme" hint="Dark is the default for trading sessions.">
        <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-black/25 p-1 ring-1 ring-white/[0.06]">
          {themes.map((t) => {
            const active = theme === t.id;
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTheme(t.id)}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-[12px] font-medium transition",
                  active
                    ? "bg-white/[0.08] text-white ring-1 ring-cyan-400/30"
                    : "text-zinc-400 hover:text-zinc-200",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>
      </SettingsRow>

      <SettingsRow
        label="Density"
        hint="Compact = trading desk packed; Comfortable = larger touch targets."
      >
        <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-black/25 p-1 ring-1 ring-white/[0.06]">
          {(["compact", "comfortable"] as Density[]).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDensity(d)}
              className={cn(
                "rounded-lg px-2.5 py-2 text-[12px] font-medium capitalize transition",
                density === d
                  ? "bg-white/[0.08] text-white ring-1 ring-cyan-400/30"
                  : "text-zinc-400 hover:text-zinc-200",
              )}
            >
              {d}
            </button>
          ))}
        </div>
      </SettingsRow>

      <SettingsRow
        label="Neon accents"
        hint="Subtle glow around active surfaces and CTAs."
      >
        <div className="flex items-center justify-between gap-3 rounded-xl bg-black/25 px-3 py-2.5 ring-1 ring-white/[0.06]">
          <span className="text-[12px] text-zinc-300">Enabled</span>
          <SettingsToggle
            checked={neonAccents}
            onChange={setNeonAccents}
            label="Neon accents"
          />
        </div>
      </SettingsRow>

      <SettingsRow
        label="Reduce motion"
        hint="Disables non-essential animations site-wide. Respects OS preference by default."
      >
        <div className="flex items-center justify-between gap-3 rounded-xl bg-black/25 px-3 py-2.5 ring-1 ring-white/[0.06]">
          <span className="text-[12px] text-zinc-300">Override OS</span>
          <SettingsToggle
            checked={reduceMotion}
            onChange={setReduceMotion}
            label="Reduce motion"
          />
        </div>
      </SettingsRow>
    </SettingsPanel>
  );
}
