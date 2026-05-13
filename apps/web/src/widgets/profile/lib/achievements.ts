import {
  Award,
  Crown,
  Flame,
  Gem,
  Rocket,
  Shield,
  Sparkles,
  Target,
  Trophy,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { ProfileStats, TraderProfile } from "./types";

export type AchievementTone = "amber" | "emerald" | "violet" | "cyan" | "rose";

export type AchievementDef = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  tone: AchievementTone;
  /** Returns a numeric `current` and `target` so the UI can render progress. */
  evaluate: (input: { stats: ProfileStats; profile: TraderProfile }) => {
    current: number;
    target: number;
  };
  /** Compact label for the progress meter, e.g. "$48.2k / $50k". */
  formatProgress: (current: number, target: number) => string;
};

function compactInt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}k`;
  return n.toFixed(0);
}

export const ACHIEVEMENTS: ReadonlyArray<AchievementDef> = [
  {
    id: "first-blood",
    title: "First fill",
    description: "Closed your first profitable trade.",
    icon: Sparkles,
    tone: "cyan",
    evaluate: ({ stats }) => ({
      current: stats.trades > 0 ? 1 : 0,
      target: 1,
    }),
    formatProgress: (c, t) => `${c} / ${t}`,
  },
  {
    id: "high-roller",
    title: "High roller",
    description: "Push lifetime volume past $1M.",
    icon: Gem,
    tone: "violet",
    evaluate: ({ stats }) => ({
      current: Math.min(stats.volumeUsd, 1_000_000),
      target: 1_000_000,
    }),
    formatProgress: (c, t) => `$${compactInt(c)} / $${compactInt(t)}`,
  },
  {
    id: "winning-streak",
    title: "Hot streak",
    description: "Win 7 trades in a row.",
    icon: Flame,
    tone: "amber",
    evaluate: ({ stats }) => ({
      current: Math.min(stats.streak, 7),
      target: 7,
    }),
    formatProgress: (c, t) => `${c} / ${t}`,
  },
  {
    id: "sharpshooter",
    title: "Sharpshooter",
    description: "Maintain a 70%+ win rate.",
    icon: Target,
    tone: "emerald",
    evaluate: ({ stats }) => ({
      current: Math.min(stats.winRatePct, 70),
      target: 70,
    }),
    formatProgress: (c, t) => `${c.toFixed(0)}% / ${t}%`,
  },
  {
    id: "alpha",
    title: "Alpha generator",
    description: "Realize $50k of net PnL.",
    icon: Trophy,
    tone: "amber",
    evaluate: ({ stats }) => ({
      current: Math.min(Math.max(stats.pnlUsd, 0), 50_000),
      target: 50_000,
    }),
    formatProgress: (c, t) => `$${compactInt(c)} / $${compactInt(t)}`,
  },
  {
    id: "diversified",
    title: "Diversified",
    description: "Hold positions across 4+ categories.",
    icon: Shield,
    tone: "cyan",
    evaluate: ({ profile }) => ({
      current: Math.min(profile.categoryMix.length, 4),
      target: 4,
    }),
    formatProgress: (c, t) => `${c} / ${t}`,
  },
  {
    id: "ranked",
    title: "Top 10",
    description: "Crack the global top 10.",
    icon: Crown,
    tone: "amber",
    evaluate: ({ profile }) => ({
      current: profile.rank <= 10 ? 1 : 0,
      target: 1,
    }),
    formatProgress: (c, t) => (c >= t ? "Unlocked" : "Locked"),
  },
  {
    id: "consistency",
    title: "Consistency",
    description: "Trade 100+ markets.",
    icon: Award,
    tone: "violet",
    evaluate: ({ stats }) => ({
      current: Math.min(stats.trades, 100),
      target: 100,
    }),
    formatProgress: (c, t) => `${c} / ${t}`,
  },
  {
    id: "lift-off",
    title: "Lift-off",
    description: "Beat +20% ROI in any window.",
    icon: Rocket,
    tone: "emerald",
    evaluate: ({ stats }) => ({
      current: Math.min(Math.max(stats.roiPct, 0), 20),
      target: 20,
    }),
    formatProgress: (c, t) => `${c.toFixed(1)}% / ${t}%`,
  },
  {
    id: "lightning",
    title: "Lightning",
    description: "Settle a single trade with $5k+ PnL.",
    icon: Zap,
    tone: "cyan",
    evaluate: ({ stats }) => ({
      current: Math.min(stats.bestTradeUsd, 5_000),
      target: 5_000,
    }),
    formatProgress: (c, t) => `$${compactInt(c)} / $${compactInt(t)}`,
  },
];

export type AchievementProgress = AchievementDef & {
  current: number;
  target: number;
  pct: number;
  unlocked: boolean;
};

export function evaluateAchievements(
  profile: TraderProfile,
): AchievementProgress[] {
  return ACHIEVEMENTS.map((def) => {
    const { current, target } = def.evaluate({
      stats: profile.stats,
      profile,
    });
    const pct = target === 0 ? 100 : Math.min(100, (current / target) * 100);
    const unlocked = current >= target;
    return { ...def, current, target, pct, unlocked };
  });
}
