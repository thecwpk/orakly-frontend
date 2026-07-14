"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { LeaderboardAvatar } from "@/features/leaderboard/components/leaderboard-avatar";
import { cn } from "@/lib/utils";
import { fetchCommunitySuggestions } from "@/shared/api/fetchers/community-suggestions";
import { fetchCreatorLeaderboard } from "@/shared/api/fetchers/leaderboard";
import { fetchMarketsExplorer } from "@/shared/api/fetchers/markets-explorer";
import { queryKeys } from "@/shared/api/query-keys";
import { ROUTES } from "@/shared/constants/routes";
import type { LiveMarketCardDto } from "@/shared/contracts/live-markets";
import { CommunitySuggestionCard } from "@/widgets/community-markets/community-suggestion-card";
import { SubmitMarketModal } from "@/widgets/community-markets/submit-market-modal";
import { LiveMarketCard } from "@/widgets/dapp-hub/sections/live-markets";
import { fmtUsdCompact } from "@/widgets/dapp-hub/lib/format-hub-metrics";
import "@/widgets/dapp-hub/hub-design-tokens.css";

type MainTab = "suggested" | "approved" | "creators";
type SuggestedSubTab = "votes" | "newest" | "mine";

const MAIN_TABS: { id: MainTab; label: string }[] = [
  { id: "suggested", label: "Suggested Markets" },
  { id: "approved", label: "Approved Markets" },
  { id: "creators", label: "Top Creators" },
];

const SUGGESTED_SUB_TABS: { id: SuggestedSubTab; label: string }[] = [
  { id: "votes", label: "Most Voted" },
  { id: "newest", label: "Newest" },
  { id: "mine", label: "My Submissions" },
];

/** Matches server `readDefaultCreatorRewardPercent` fallback. */
const DEFAULT_CREATOR_REWARD_PERCENT = 5;

function suggestedFetchParams(subTab: SuggestedSubTab, walletAddress: string | null) {
  if (subTab === "mine") {
    return {
      status: "all",
      sort: "newest" as const,
      address: walletAddress ?? undefined,
    };
  }
  if (subTab === "newest") {
    return { status: "pending", sort: "newest" as const };
  }
  return { status: "pending", sort: "votes" as const };
}

function shortenAddress(addr: string): string {
  if (addr.length < 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function formatCreatorScore(score: number): string {
  if (!Number.isFinite(score)) return "—";
  if (score >= 1_000_000) return `${(score / 1_000_000).toFixed(1)}M`;
  if (score >= 1_000) return `${(score / 1_000).toFixed(1)}k`;
  return score.toFixed(score >= 10 ? 0 : 1);
}

export default function CommunityMarketsPage() {
  const [mainTab, setMainTab] = useState<MainTab>("suggested");
  const [subTab, setSubTab] = useState<SuggestedSubTab>("votes");
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const { address } = useAccount();

  const suggestionParams = useMemo(
    () => suggestedFetchParams(subTab, address ?? null),
    [subTab, address],
  );

  const suggestionsQueryKey = queryKeys.markets.communitySuggestions({
    tab: subTab,
    status: suggestionParams.status,
    sort: suggestionParams.sort,
    address: suggestionParams.address,
  });

  const suggestionsQuery = useQuery({
    queryKey: suggestionsQueryKey,
    queryFn: () => fetchCommunitySuggestions(suggestionParams),
    staleTime: 30_000,
    enabled: mainTab === "suggested" && (subTab !== "mine" || Boolean(address)),
  });

  const approvedQuery = useQuery({
    queryKey: ["community", "approved-markets"] as const,
    queryFn: () =>
      fetchMarketsExplorer({
        page: 1,
        limit: 24,
        status: "OPEN",
        sort: "volume",
        communityOnly: true,
      }),
    staleTime: 30_000,
    enabled: mainTab === "approved",
  });

  const creatorsQuery = useQuery({
    queryKey: ["community", "creator-leaderboard", 50] as const,
    queryFn: () => fetchCreatorLeaderboard(50),
    staleTime: 60_000,
    enabled: mainTab === "creators",
  });

  const suggestions = suggestionsQuery.data ?? [];
  const approvedMarkets = (approvedQuery.data?.markets ?? []) as LiveMarketCardDto[];
  const creators = creatorsQuery.data ?? [];
  const showMineConnectPrompt = mainTab === "suggested" && subTab === "mine" && !address;

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 pb-16 pt-10 md:pt-12">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <h1 className="text-[32px] font-bold leading-tight tracking-tight text-white">
            Community
          </h1>
          <p className="text-[14px] text-zinc-500">
            The community decides what markets go live
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowSubmitModal(true)}
          className="inline-flex shrink-0 items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
        >
          Submit Market Idea
        </button>
      </header>

      <div className="flex flex-wrap gap-2 border-b border-white/[0.06]">
        {MAIN_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setMainTab(tab.id)}
            className={cn(
              "-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold transition",
              mainTab === tab.id
                ? "border-blue-500 text-blue-200"
                : "border-transparent text-zinc-500 hover:border-white/10 hover:text-zinc-300",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {mainTab === "suggested" ? (
        <section className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_SUB_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSubTab(tab.id)}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition ring-1",
                  subTab === tab.id
                    ? "bg-blue-500/15 text-blue-100 ring-blue-400/30"
                    : "bg-white/[0.02] text-zinc-400 ring-white/[0.06] hover:bg-white/[0.04] hover:text-zinc-200",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {showMineConnectPrompt ? (
            <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-white/[0.1] bg-white/[0.02] px-6 py-12 text-center">
              <p className="text-sm font-medium text-zinc-400">
                Connect your wallet to view your submissions.
              </p>
            </div>
          ) : suggestionsQuery.isLoading ? (
            <div className="grid gap-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-40 animate-pulse rounded-2xl bg-zinc-800/80" />
              ))}
            </div>
          ) : suggestions.length === 0 ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/[0.1] bg-white/[0.02] px-6 py-12 text-center">
              <p className="text-sm font-medium text-zinc-300">No submissions yet</p>
              <p className="max-w-sm text-[12px] text-zinc-500">
                Be the first to propose a market idea for the community to vote on.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {suggestions.map((suggestion) => (
                <CommunitySuggestionCard
                  key={suggestion.id}
                  suggestion={suggestion}
                  walletAddress={address ?? null}
                  queryKey={suggestionsQueryKey}
                />
              ))}
            </div>
          )}
        </section>
      ) : null}

      {mainTab === "approved" ? (
        <section className="space-y-4">
          <p className="text-[13px] text-zinc-500">
            These markets were submitted by the community and approved by admin.
          </p>

          {approvedQuery.isLoading ? (
            <div className="hub-root grid grid-cols-1 gap-4 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-48 animate-pulse rounded-2xl bg-zinc-800/80" />
              ))}
            </div>
          ) : approvedMarkets.length === 0 ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/[0.1] bg-white/[0.02] px-6 py-12 text-center">
              <p className="text-sm font-medium text-zinc-300">No community markets live yet</p>
              <p className="max-w-sm text-[12px] text-zinc-500">
                Approved community ideas will appear here once they are open for trading.
              </p>
            </div>
          ) : (
            <div className="hub-root grid grid-cols-1 gap-4 md:grid-cols-2">
              {approvedMarkets.map((market) => (
                <LiveMarketCard key={market.id} market={market} />
              ))}
            </div>
          )}
        </section>
      ) : null}

      {mainTab === "creators" ? (
        <section className="space-y-6">
          {creatorsQuery.isLoading ? (
            <div className="h-64 animate-pulse rounded-2xl bg-zinc-800/80" />
          ) : creators.length === 0 ? (
            <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-white/[0.1] bg-white/[0.02] px-6 py-12 text-center">
              <p className="text-sm font-medium text-zinc-400">No creators ranked yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-white/[0.08]">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-white/[0.06] bg-white/[0.02] text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  <tr>
                    <th className="px-4 py-3">Rank</th>
                    <th className="px-4 py-3">Creator</th>
                    <th className="px-4 py-3">Approved Markets</th>
                    <th className="px-4 py-3">Total Volume</th>
                    <th className="px-4 py-3">Fees Earned</th>
                    <th className="px-4 py-3 text-right">Creator Score</th>
                  </tr>
                </thead>
                <tbody>
                  {creators.map((row, index) => (
                    <tr
                      key={row.creatorAddress}
                      className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02]"
                    >
                      <td className="px-4 py-3 font-mono tabular-nums text-zinc-400">
                        #{index + 1}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={ROUTES.traderProfile(row.creatorAddress)}
                          className="inline-flex items-center gap-2.5 text-zinc-200 transition hover:text-white"
                        >
                          <LeaderboardAvatar address={row.creatorAddress} className="h-7 w-7" />
                          <span className="font-mono text-[13px] tabular-nums">
                            {shortenAddress(row.creatorAddress)}
                          </span>
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-mono tabular-nums text-zinc-300">
                        {row.marketCount}
                      </td>
                      <td className="px-4 py-3 font-mono tabular-nums text-zinc-300">
                        {fmtUsdCompact(row.totalVolumeUsd)}
                      </td>
                      <td className="px-4 py-3 font-mono tabular-nums text-emerald-300">
                        {fmtUsdCompact(row.feesEarned)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums font-semibold text-zinc-100">
                        {formatCreatorScore(row.creatorScore)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="rounded-2xl border border-white/[0.08] bg-zinc-900/50 p-6">
            <h2 className="text-base font-semibold text-zinc-100">How Creator Rewards Work</h2>
            <ul className="mt-3 space-y-2 text-[13px] leading-relaxed text-zinc-400">
              <li>
                When your market idea is approved and deployed, you earn{" "}
                {DEFAULT_CREATOR_REWARD_PERCENT}% of all trading fees generated by that market.
              </li>
              <li>The more volume your market generates, the more you earn.</li>
              <li>
                Rewards are automatically calculated and claimable from your Portfolio page.
              </li>
            </ul>
            <button
              type="button"
              onClick={() => {
                setMainTab("suggested");
                setShowSubmitModal(true);
              }}
              className="mt-5 inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
            >
              Submit Your First Market Idea
            </button>
          </div>
        </section>
      ) : null}

      <SubmitMarketModal
        open={showSubmitModal}
        onOpenChange={setShowSubmitModal}
        onSuccess={() => {
          void suggestionsQuery.refetch();
          setMainTab("suggested");
          setSubTab("mine");
        }}
      />
    </main>
  );
}
