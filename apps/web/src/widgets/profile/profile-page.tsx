"use client";

import { ArrowUpRight, User } from "lucide-react";
import { useState } from "react";
import { RealtimeActivityFeed } from "@/features/realtime-activity";
import { PrefetchLink } from "@/shared/ui";
import { ROUTES } from "@/shared/constants/routes";
import { ProfileAchievements } from "./components/profile-achievements";
import { ProfileEquityChart } from "./components/profile-equity-chart";
import { ProfileHero } from "./components/profile-hero";
import { ProfilePortfolioOverview } from "./components/profile-portfolio-overview";
import { ProfileStatsGrid } from "./components/profile-stats-grid";
import { ProfileTradeHistory } from "./components/profile-trade-history";
import { useProfileData } from "./hooks/use-profile-data";
import type { ProfileWindow } from "./lib/types";

export type ProfilePageProps = {
  address?: string;
};

function ProfileSignInGate() {
  return (
    <main className="mx-auto flex max-w-md flex-col items-center px-4 pb-s64 pt-s48 text-center md:pt-s56">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--hub-primary-soft)] ring-1 ring-[var(--hub-border)]">
        <User className="h-6 w-6 text-[var(--hub-primary-bright)]" aria-hidden />
      </span>
      <h1 className="mt-4 text-lg font-semibold text-[var(--hub-fg)]">Sign in to view profile</h1>
      <p className="mt-2 text-[13px] leading-relaxed text-[var(--hub-muted)]">
        Connect your wallet to see your public trader profile, stats, and trade history.
      </p>
      <PrefetchLink
        href={ROUTES.wallet}
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[var(--hub-primary)]/20 px-4 py-2.5 text-[13px] font-semibold text-[var(--hub-fg)] ring-1 ring-[var(--hub-border-strong)] transition hover:bg-[var(--hub-primary)]/30"
      >
        Connect wallet <ArrowUpRight className="h-3.5 w-3.5" />
      </PrefetchLink>
    </main>
  );
}

export function ProfilePage({ address }: ProfilePageProps) {
  const isMine = !address;
  const [window, setWindow] = useState<ProfileWindow>("30d");
  const { profile, isLoading } = useProfileData(address);

  if (isMine && !isLoading && !profile) {
    return <ProfileSignInGate />;
  }

  if (isLoading || !profile) {
    return (
      <main className="mx-auto flex max-w-6xl flex-col pb-s64 pt-s48 md:pt-s56">
        <p className="px-4 text-sm text-[var(--hub-muted)]">Loading profile…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-6xl flex-col pb-s64 pt-s48 md:pt-s56">
      <div className="mb-r24">
        <ProfileHero
          address={profile.address}
          alias={profile.alias}
          isMine={isMine}
          rank={profile.rank}
          followers={profile.followers}
          following={profile.following}
          joinedAt={profile.joinedAt}
          stats={profile.stats}
        />
      </div>

      <ProfileStatsGrid className="mb-s40" stats={profile.stats} />

      <div className="mb-s48 grid gap-r24 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-r24">
        <ProfileEquityChart
          data={profile.equity}
          window={window}
          onWindowChange={setWindow}
        />
        <ProfilePortfolioOverview
          exposures={profile.exposures}
          categoryMix={profile.categoryMix}
        />
      </div>

      <ProfileAchievements className="mb-s40" profile={profile} />

      <div className="grid gap-r24 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-r24">
        <ProfileTradeHistory trades={profile.trades} />
        <RealtimeActivityFeed
          title="Live activity"
          eyebrow="Tape"
          height="540px"
          maxRows={40}
          showFilterTabs={false}
        />
      </div>
    </main>
  );
}
