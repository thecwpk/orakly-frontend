"use client";

import { motion } from "framer-motion";
import {
  CheckCircle2,
  Copy,
  Crown,
  Share2,
  Sparkles,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import { memo, useEffect, useState } from "react";
import { toast } from "sonner";
import { ROUTES } from "@/shared/constants/routes";
import { cn } from "@/lib/utils";
import { formatJoined, shortAddress, signedPct } from "../lib/format";
import type { ProfileStats } from "../lib/types";
import { AnimatedStat } from "./animated-stat";

export type ProfileHeroProps = {
  address: string;
  alias: string;
  isMine: boolean;
  rank: number;
  followers: number;
  following: number;
  joinedAt: string;
  stats: ProfileStats;
};

function ProfileHeroInner({
  address,
  alias,
  isMine,
  rank,
  followers,
  following,
  joinedAt,
  stats,
}: ProfileHeroProps) {
  const [following_, setFollowing] = useState(false);
  const [copiedAddr, setCopiedAddr] = useState(false);

  useEffect(() => {
    if (!copiedAddr) return;
    const id = window.setTimeout(() => setCopiedAddr(false), 1400);
    return () => window.clearTimeout(id);
  }, [copiedAddr]);

  const handleShare = async () => {
    try {
      const url =
        typeof window !== "undefined"
          ? `${window.location.origin}${ROUTES.traderProfile(address)}`
          : ROUTES.traderProfile(address);
      const nav =
        typeof window !== "undefined"
          ? (window.navigator as Navigator & {
              share?: (data: ShareData) => Promise<void>;
            })
          : null;
      if (nav?.share) {
        await nav.share({ title: `${alias} on Orakly`, url });
        return;
      }
      if (nav?.clipboard) {
        await nav.clipboard.writeText(url);
        toast.success("Profile link copied");
      }
    } catch {
      /* user dismissed share sheet */
    }
  };

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddr(true);
      toast.success("Address copied");
    } catch {
      toast.error("Could not copy");
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="glass-panel-strong neon-edge-violet relative overflow-hidden rounded-2xl"
    >
      {/* Ambient backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-20 h-64 w-64 rounded-full bg-gradient-to-br from-violet-500/30 via-fuchsia-500/15 to-transparent blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-16 -bottom-16 h-56 w-56 rounded-full bg-cyan-500/25 blur-3xl"
      />

      <div className="relative grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-end">
        {/* Identity */}
        <div className="flex min-w-0 items-start gap-4">
          <Avatar address={address} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-balance text-[22px] font-semibold tracking-tight text-[var(--hub-fg)] sm:text-[28px]">
                {alias}
              </h1>
              <Badge tone={isMine ? "emerald" : "violet"}>
                {isMine ? "Mine" : "Public"}
              </Badge>
              <Badge tone="amber">
                <Crown className="h-3 w-3" />
                Rank #{rank}
              </Badge>
            </div>
            <button
              type="button"
              onClick={() => void handleCopyAddress()}
              className={cn(
                "group mt-1 inline-flex items-center gap-1.5 rounded-md px-1 py-0.5 font-mono text-[11.5px] text-[var(--hub-muted)] transition hover:bg-[var(--hub-bg-subtle)] hover:text-[var(--hub-fg)]",
                copiedAddr && "bg-emerald-500/10 text-emerald-200",
              )}
              aria-label="Copy address"
            >
              {shortAddress(address)}
              {copiedAddr ? (
                <CheckCircle2 className="h-3 w-3" />
              ) : (
                <Copy className="h-3 w-3 opacity-60 group-hover:opacity-100" />
              )}
            </button>

            <ul className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[var(--hub-muted)]">
              <li className="inline-flex items-center gap-1">
                <Users className="h-3 w-3" />
                <span className="font-mono font-bold tabular-nums text-[var(--hub-fg)]">
                  {followers.toLocaleString()}
                </span>
                followers
              </li>
              <li>
                <span className="font-mono font-bold tabular-nums text-[var(--hub-muted)]">
                  {following.toLocaleString()}
                </span>{" "}
                following
              </li>
              <li className="inline-flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Joined {formatJoined(joinedAt)}
              </li>
              <li
                className={cn(
                  "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[10px] font-bold ring-1",
                  stats.delta24h >= 0
                    ? "bg-emerald-500/10 text-emerald-200 ring-emerald-400/25"
                    : "bg-rose-500/10 text-rose-200 ring-rose-400/25",
                )}
              >
                <TrendingUp className="h-2.5 w-2.5" />
                {signedPct(stats.delta24h, 2)} 24h
              </li>
            </ul>

            <div className="mt-4 flex flex-wrap gap-2">
              {!isMine ? (
                <button
                  type="button"
                  onClick={() => setFollowing((v) => !v)}
                  aria-pressed={following_}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-bold ring-1 transition",
                    following_
                      ? "bg-emerald-500/15 text-emerald-200 ring-emerald-400/30 hover:bg-emerald-500/20"
                      : "bg-gradient-to-r from-cyan-400 to-[var(--hub-primary-bright)] text-zinc-950 ring-[var(--hub-border)] hover:brightness-110",
                  )}
                >
                  {following_ ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Following
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-3.5 w-3.5" />
                      Follow
                    </>
                  )}
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => void handleShare()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--hub-bg-subtle)] px-3 py-1.5 text-[12px] font-medium text-[var(--hub-fg)] ring-1 ring-[var(--hub-border)] transition hover:bg-[var(--hub-card-hover)]"
              >
                <Share2 className="h-3.5 w-3.5" />
                Share
              </button>
              <button
                type="button"
                onClick={() => void handleCopyAddress()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--hub-bg-subtle)] px-3 py-1.5 text-[12px] font-medium text-[var(--hub-muted)] ring-1 ring-[var(--hub-border)] transition hover:bg-[var(--hub-card-hover)]"
              >
                <Copy className="h-3.5 w-3.5" />
                Copy address
              </button>
            </div>
          </div>
        </div>

        {/* Headline KPIs */}
        <dl className="grid grid-cols-3 gap-2 sm:gap-2.5">
          <AnimatedStat
            label="PnL"
            value={stats.pnlUsd}
            format="signed-usd"
            tone={stats.pnlUsd >= 0 ? "emerald" : "rose"}
            hint="Realized + unrealized"
          />
          <AnimatedStat
            label="Volume"
            value={stats.volumeUsd}
            format="usd"
            tone="neutral"
            hint="Notional traded"
          />
          <AnimatedStat
            label="Win rate"
            value={stats.winRatePct}
            format="pct"
            tone="cyan"
            hint={`${stats.trades.toLocaleString()} trades`}
          />
        </dl>
      </div>
    </motion.section>
  );
}

function Avatar({ address }: { address: string }) {
  const seed = address.replace(/^0x/, "").slice(0, 4).toUpperCase();
  const hue1 = (parseInt(seed[0] ?? "0", 16) * 22) % 360;
  const hue2 = (hue1 + 120) % 360;
  return (
    <motion.div
      initial={{ scale: 0.92, rotate: -8, opacity: 0 }}
      animate={{ scale: 1, rotate: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 320, damping: 22 }}
      className="relative grid h-16 w-16 shrink-0 place-items-center rounded-2xl ring-1 ring-white/15"
      style={{
        background: `conic-gradient(from 90deg, hsl(${hue1} 90% 60% / 0.85), hsl(${hue2} 90% 60% / 0.85), hsl(${hue1} 90% 60% / 0.85))`,
      }}
    >
      <div className="absolute inset-0.5 rounded-[14px] bg-[#06060a]/60 backdrop-blur-sm" />
      <span className="relative font-mono text-[13px] font-bold uppercase tracking-tight text-[var(--hub-fg)]">
        {seed}
      </span>
    </motion.div>
  );
}

function Badge({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "emerald" | "violet" | "amber";
}) {
  const toneClass: Record<typeof tone, string> = {
    emerald: "bg-emerald-500/15 text-emerald-200 ring-emerald-400/30",
    violet: "bg-[var(--hub-primary-soft)] text-violet-200 ring-[var(--hub-border-strong)]",
    amber: "bg-amber-500/15 text-amber-200 ring-amber-400/30",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1",
        toneClass[tone],
      )}
    >
      {children}
    </span>
  );
}

export const ProfileHero = memo(ProfileHeroInner);
