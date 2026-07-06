"use client";

import { ArrowUpRight, User } from "lucide-react";
import { useState } from "react";
import { CreatorRewardsPanel } from "@/features/creator/components/creator-rewards-panel";
import { RealtimeActivityFeed } from "@/features/realtime-activity";
import { PrefetchLink } from "@/shared/ui";
import { ROUTES } from "@/shared/constants/routes";
import { cn } from "@/lib/utils";
import { ProfileAchievements } from "./components/profile-achievements";
import { ProfileEquityChart } from "./components/profile-equity-chart";
import { ProfileHeaderStats } from "./components/profile-header-stats";
import { ProfileHero } from "./components/profile-hero";
import { ProfileOpenPositions } from "./components/profile-open-positions";
import { ProfilePnlChart } from "./components/profile-pnl-chart";
import { ProfilePortfolioOverview } from "./components/profile-portfolio-overview";
import { ProfileStatsGrid } from "./components/profile-stats-grid";
import { ProfileTradeHistory } from "./components/profile-trade-history";
import { ProfileTradeHistoryTable } from "./components/profile-trade-history-table";
import { useProfileData } from "./hooks/use-profile-data";
import type { ProfileWindow } from "./lib/types";

export type ProfilePageProps = {
  address?: string;
};

type ProfileTab = "overview" | "positions" | "history" | "creator";

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
  const [activeTab, setActiveTab] = useState<ProfileTab>("overview");
  const [window, setWindow] = useState<ProfileWindow>("30d");
  const { profile, isMine, isLoading } = useProfileData(address);

  if (!address && !isLoading && !profile) {
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
    <main className="hub-root mx-auto flex max-w-6xl flex-col pb-s64 pt-s48 md:pt-s56">
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

      <ProfileHeaderStats
        className="mb-s40"
        winRatePct={profile.stats.winRatePct}
        totalPnlUsd={profile.stats.pnlUsd}
        totalVolumeUsd={profile.stats.volumeUsd}
        openPositions={profile.positions?.length ?? profile.activeMarkets}
        rank={profile.rank}
      />

      <div className="mb-s40 flex flex-wrap gap-2 border-b border-[var(--hub-border)] pb-px">
        {(
          [
            { id: "overview" as const, label: "Overview" },
            { id: "positions" as const, label: "Positions" },
            { id: "history" as const, label: "History" },
            { id: "creator" as const, label: "Creator" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "-mb-px border-b-2 px-4 py-2 text-sm font-semibold transition",
              activeTab === tab.id
                ? "border-[var(--hub-primary-bright)] text-[var(--hub-fg)]"
                : "border-transparent text-[var(--hub-muted)] hover:border-[var(--hub-border)] hover:text-[var(--hub-fg)]",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "creator" ? (
        <CreatorRewardsPanel address={profile.address} />
      ) : activeTab === "positions" ? (
        <div className="mb-s48">
          <ProfileOpenPositions positions={profile.positions ?? []} />
        </div>
      ) : activeTab === "history" ? (
        <div className="space-y-s48">
          <ProfileTradeHistoryTable
            address={profile.address}
            initialTrades={profile.publicTrades ?? []}
            initialCursor={profile.tradesNextCursor ?? null}
          />
          <ProfileTradeHistory trades={profile.trades} />
        </div>
      ) : (
        <>
          <ProfileStatsGrid className="mb-s40" stats={profile.stats} />

          <div className="mb-s48 grid gap-r24 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-r24">
            <ProfilePnlChart
              trades={profile.trades}
              currentPnlUsd={profile.stats.pnlUsd}
            />
            <ProfileEquityChart
              data={profile.equity}
              window={window}
              onWindowChange={setWindow}
            />
          </div>

          <div className="mb-s48 grid gap-r24 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-r24">
            <ProfilePortfolioOverview
              exposures={profile.exposures}
              categoryMix={profile.categoryMix}
            />
            <RealtimeActivityFeed
              title="Live activity"
              eyebrow="Tape"
              height="540px"
              maxRows={40}
              showFilterTabs={false}
            />
          </div>

          <ProfileAchievements className="mb-s40" profile={profile} />
        </>
      )}
    </main>
  );
}
