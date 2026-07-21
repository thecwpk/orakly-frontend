"use client";

import { useEffect, useState } from "react";
import { Moon, Sparkles, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import {
  SettingsPanel,
  SettingsRow,
  SettingsToggle,
  settingsChoiceActiveClass,
  settingsChoiceInactiveClass,
  settingsInsetClass,
} from "../components/settings-panel";

type Theme = "dark" | "system" | "light";
type Density = "compact" | "comfortable";

export function AppearanceSettingsPanel() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [density, setDensity] = useState<Density>("compact");
  const [reduceMotion, setReduceMotion] = useState(false);
  const [neonAccents, setNeonAccents] = useState(true);

  useEffect(() => setMounted(true), []);

  const activeTheme: Theme =
    theme === "light" || theme === "system" ? theme : "dark";

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
      <SettingsRow
        label="Theme"
        hint={
          mounted
            ? `Active: ${resolvedTheme ?? activeTheme}. Dark is recommended for trading.`
            : "Dark is the default for trading sessions."
        }
      >
        <div className={cn("grid grid-cols-3 gap-1.5 p-1", settingsInsetClass)}>
          {themes.map((t) => {
            const active = mounted && activeTheme === t.id;
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTheme(t.id)}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-[12px] font-medium transition",
                  active ? settingsChoiceActiveClass : settingsChoiceInactiveClass,
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
        <div className={cn("grid grid-cols-2 gap-1.5 p-1", settingsInsetClass)}>
          {(["compact", "comfortable"] as Density[]).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDensity(d)}
              className={cn(
                "rounded-lg px-2.5 py-2 text-[12px] font-medium capitalize transition",
                density === d ? settingsChoiceActiveClass : settingsChoiceInactiveClass,
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
        <div className={cn("flex items-center justify-between gap-3 px-3 py-2.5", settingsInsetClass)}>
          <span className="text-[12px] text-[var(--hub-fg)]">Enabled</span>
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
        <div className={cn("flex items-center justify-between gap-3 px-3 py-2.5", settingsInsetClass)}>
          <span className="text-[12px] text-[var(--hub-fg)]">Override OS</span>
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
