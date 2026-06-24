"use client";

import { ArrowUpRight, User } from "lucide-react";
import { useState } from "react";
import { PrefetchLink } from "@/shared/ui";
import { ROUTES } from "@/shared/constants/routes";
import { useTradingUserId } from "@/state/selectors/auth.selectors";
import {
  SettingsPanel,
  SettingsRow,
  SettingsToggle,
  settingsInputClass,
} from "../components/settings-panel";

export function GeneralSettingsPanel() {
  const tradingUserId = useTradingUserId();
  const [displayName, setDisplayName] = useState("");
  const [showInLeaderboard, setShowInLeaderboard] = useState(true);
  const [language, setLanguage] = useState("en");

  if (!tradingUserId) {
    return (
      <SettingsPanel
        title="General"
        description="Sign in to manage your display name and public profile."
      >
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--hub-primary-soft)] ring-1 ring-[var(--hub-border)]">
            <User className="h-5 w-5 text-[var(--hub-primary-bright)]" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-medium text-[var(--hub-fg)]">Sign in to continue</p>
            <p className="mt-1 text-[12px] text-[var(--hub-muted)]">
              Connect your wallet to edit profile settings.
            </p>
          </div>
          <PrefetchLink
            href={ROUTES.wallet}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--hub-primary)]/20 px-4 py-2 text-[13px] font-semibold text-[var(--hub-fg)] ring-1 ring-[var(--hub-border-strong)] transition hover:bg-[var(--hub-primary)]/30"
          >
            Wallet <ArrowUpRight className="h-3.5 w-3.5" />
          </PrefetchLink>
        </div>
      </SettingsPanel>
    );
  }

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
          placeholder="Your display name"
          className={settingsInputClass}
          maxLength={40}
        />
      </SettingsRow>

      <SettingsRow
        label="Public profile"
        hint="When off, your trader profile is private and you're hidden from leaderboards."
      >
        <div className="flex items-center justify-between gap-3 rounded-lg border border-[var(--hub-border)] bg-[var(--hub-bg-subtle)] px-3 py-2.5">
          <span className="text-[12px] text-[var(--hub-fg)]">Show me publicly</span>
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
          className={settingsInputClass}
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
