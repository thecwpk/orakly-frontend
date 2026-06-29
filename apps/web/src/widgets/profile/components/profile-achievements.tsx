"use client";

import { motion } from "framer-motion";
import { Award, Lock } from "lucide-react";
import { memo, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  evaluateAchievements,
  type AchievementProgress,
  type AchievementTone,
} from "../lib/achievements";
import type { TraderProfile } from "../lib/types";

const TONE: Record<AchievementTone, { ring: string; glow: string; text: string; bg: string }> = {
  amber: {
    ring: "ring-amber-400/40",
    glow: "from-amber-400/30 via-amber-400/8 to-transparent",
    text: "text-amber-200",
    bg: "bg-amber-500/15",
  },
  emerald: {
    ring: "ring-emerald-400/40",
    glow: "from-emerald-400/25 via-emerald-400/8 to-transparent",
    text: "text-emerald-200",
    bg: "bg-emerald-500/15",
  },
  cyan: {
    ring: "ring-cyan-400/40",
    glow: "from-cyan-400/25 via-cyan-400/8 to-transparent",
    text: "text-cyan-200",
    bg: "bg-cyan-500/15",
  },
  violet: {
    ring: "ring-violet-400/40",
    glow: "from-[var(--hub-primary-bright)]/25 via-violet-400/8 to-transparent",
    text: "text-violet-200",
    bg: "bg-[var(--hub-primary-soft)]",
  },
  rose: {
    ring: "ring-rose-400/40",
    glow: "from-rose-400/25 via-rose-400/8 to-transparent",
    text: "text-rose-200",
    bg: "bg-rose-500/15",
  },
};

export type ProfileAchievementsProps = {
  profile: TraderProfile;
  className?: string;
};

function ProfileAchievementsInner({ profile, className }: ProfileAchievementsProps) {
  const list = useMemo(() => evaluateAchievements(profile), [profile]);
  const unlockedCount = list.filter((a) => a.unlocked).length;

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      aria-label="Achievements"
      className={cn(
        "glass-panel-strong overflow-hidden rounded-2xl ring-1 ring-[var(--hub-border)]",
        className,
      )}
    >
      <header className="flex items-center justify-between gap-3 border-b border-[var(--hub-border)] px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-amber-500/10 text-amber-300 ring-1 ring-amber-400/25">
            <Award className="h-3.5 w-3.5" />
          </span>
          <div>
            <p className="text-[9.5px] font-bold uppercase tracking-[0.2em] text-[var(--hub-muted)]">
              Milestones
            </p>
            <h2 className="text-[14px] font-semibold tracking-tight text-[var(--hub-fg)]">
              Achievements
            </h2>
          </div>
        </div>
        <span className="rounded-md bg-[var(--hub-bg-subtle)] px-1.5 py-0.5 font-mono text-[10.5px] tabular-nums text-[var(--hub-muted)] ring-1 ring-[var(--hub-border)]">
          {unlockedCount} / {list.length}
        </span>
      </header>

      <ul className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3 sm:gap-2.5 sm:p-4 lg:grid-cols-5">
        {list.map((achievement, i) => (
          <AchievementCard key={achievement.id} achievement={achievement} index={i} />
        ))}
      </ul>
    </motion.section>
  );
}

function AchievementCard({
  achievement,
  index,
}: {
  achievement: AchievementProgress;
  index: number;
}) {
  const Icon = achievement.icon;
  const tone = TONE[achievement.tone];
  const unlocked = achievement.unlocked;

  return (
    <motion.li
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className={cn(
        "group relative overflow-hidden rounded-xl px-3 py-3 ring-1 transition",
        unlocked
          ? cn("bg-[var(--hub-bg-subtle)]", tone.ring)
          : "bg-[var(--hub-bg-subtle)] ring-white/[0.05] hover:ring-white/[0.1]",
      )}
    >
      {unlocked ? (
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-100 transition-opacity",
            tone.glow,
          )}
        />
      ) : null}
      <div className="relative flex items-start justify-between gap-2">
        <span
          className={cn(
            "inline-flex h-8 w-8 items-center justify-center rounded-md ring-1 transition",
            unlocked
              ? cn(tone.bg, tone.text, tone.ring)
              : "bg-[var(--hub-bg-subtle)] text-[var(--hub-muted)] ring-[var(--hub-border)]",
          )}
        >
          {unlocked ? (
            <Icon className="h-4 w-4" />
          ) : (
            <Lock className="h-3.5 w-3.5" />
          )}
        </span>
        {unlocked ? (
          <span
            className={cn(
              "rounded-full px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider ring-1",
              tone.bg,
              tone.text,
              tone.ring,
            )}
          >
            Unlocked
          </span>
        ) : (
          <span className="rounded-full bg-[var(--hub-bg-subtle)] px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-[var(--hub-muted)] ring-1 ring-[var(--hub-border)]">
            Locked
          </span>
        )}
      </div>

      <div className="relative mt-2">
        <p
          className={cn(
            "text-[12px] font-semibold leading-tight",
            unlocked ? "text-[var(--hub-fg)]" : "text-[var(--hub-muted)]",
          )}
        >
          {achievement.title}
        </p>
        <p className="mt-0.5 line-clamp-2 text-[10.5px] leading-snug text-[var(--hub-muted)]">
          {achievement.description}
        </p>
      </div>

      <div className="relative mt-2">
        <div className="h-1.5 overflow-hidden rounded-full bg-[var(--hub-bg-subtle)]">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${achievement.pct}%` }}
            transition={{
              delay: 0.2 + index * 0.04,
              type: "spring",
              stiffness: 220,
              damping: 28,
            }}
            className={cn(
              "h-full rounded-full",
              unlocked
                ? cn(
                    "bg-gradient-to-r",
                    achievement.tone === "amber" && "from-amber-400 to-rose-400",
                    achievement.tone === "emerald" && "from-emerald-400 to-cyan-400",
                    achievement.tone === "cyan" && "from-cyan-400 to-[var(--hub-primary-bright)]",
                    achievement.tone === "violet" && "from-[var(--hub-primary-bright)] to-fuchsia-400",
                    achievement.tone === "rose" && "from-rose-400 to-amber-400",
                  )
                : "bg-[var(--hub-track-bg)]",
            )}
          />
        </div>
        <p className="mt-1 text-right font-mono text-[10px] tabular-nums text-[var(--hub-muted)]">
          {achievement.formatProgress(achievement.current, achievement.target)}
        </p>
      </div>
    </motion.li>
  );
}

export const ProfileAchievements = memo(ProfileAchievementsInner);
