"use client";

import { useState } from "react";
import {
  SettingsPanel,
  SettingsRow,
  SettingsToggle,
} from "../components/settings-panel";
import { wizardInputClass } from "@/widgets/market-create/components/wizard-field";

export function GeneralSettingsPanel() {
  const [displayName, setDisplayName] = useState("trader.eth");
  const [showInLeaderboard, setShowInLeaderboard] = useState(true);
  const [language, setLanguage] = useState("en");

  return (
    <SettingsPanel
      title="General"
      description="Display name, locale, and public-facing identity defaults."
    >
      <SettingsRow
        label="Display name"
        hint="Shown on leaderboard, public profile, and shared trade screenshots."
      >
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className={wizardInputClass}
          maxLength={40}
        />
      </SettingsRow>

      <SettingsRow
        label="Public profile"
        hint="When off, your trader profile is private and you're hidden from leaderboards."
      >
        <div className="flex items-center justify-between gap-3 rounded-xl bg-black/25 px-3 py-2.5 ring-1 ring-white/[0.06]">
          <span className="text-[12px] text-zinc-300">Show me publicly</span>
          <SettingsToggle
            checked={showInLeaderboard}
            onChange={setShowInLeaderboard}
            label="Show in leaderboard"
          />
        </div>
      </SettingsRow>

      <SettingsRow label="Language" hint="UI labels and number formatting.">
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className={wizardInputClass}
        >
          <option value="en">English</option>
          <option value="de">Deutsch</option>
          <option value="es">Español</option>
          <option value="ja">日本語</option>
        </select>
      </SettingsRow>
    </SettingsPanel>
  );
}
