"use client";

import { useMemo, useState } from "react";
import { RealtimeActivityFeed } from "@/features/realtime-activity";
import { ProfileAchievements } from "./components/profile-achievements";
import { ProfileEquityChart } from "./components/profile-equity-chart";
import { ProfileHero } from "./components/profile-hero";
import { ProfilePortfolioOverview } from "./components/profile-portfolio-overview";
import { ProfileStatsGrid } from "./components/profile-stats-grid";
import { ProfileTradeHistory } from "./components/profile-trade-history";
import { buildTraderProfile } from "./lib/mock-profile";
import type { ProfileWindow } from "./lib/types";

export type ProfilePageProps = {
  /** Public profile when set; "your own" profile when omitted. */
  address?: string;
};

export function ProfilePage({ address }: ProfilePageProps) {
  const isMine = !address;
  const [window, setWindow] = useState<ProfileWindow>("30d");

  const profile = useMemo(
    () => buildTraderProfile({ address, window, isMine }),
    [address, window, isMine],
  );

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
