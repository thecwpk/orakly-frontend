"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { Users } from "lucide-react";
import { fetchCommunitySuggestions } from "@/shared/api/fetchers/community-suggestions";
import { queryKeys } from "@/shared/api/query-keys";
import { cn } from "@/lib/utils";
import { CommunitySuggestionCard } from "@/widgets/community-markets/community-suggestion-card";
import { SubmitMarketModal } from "@/widgets/community-markets/submit-market-modal";

type CommunityTab = "trending" | "new" | "mine";

const TABS: { id: CommunityTab; label: string }[] = [
  { id: "trending", label: "Trending" },
  { id: "new", label: "New" },
  { id: "mine", label: "My Submissions" },
];

function tabFetchParams(tab: CommunityTab, walletAddress: string | null) {
  if (tab === "mine") {
    return {
      status: "all",
      sort: "newest" as const,
      address: walletAddress ?? undefined,
    };
  }
  if (tab === "new") {
    return { status: "pending", sort: "newest" as const };
  }
  return { status: "pending", sort: "votes" as const };
}

export default function CommunityMarketsPage() {
  const [activeTab, setActiveTab] = useState<CommunityTab>("trending");
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const { address } = useAccount();

  const fetchParams = useMemo(
    () => tabFetchParams(activeTab, address ?? null),
    [activeTab, address],
  );

  const queryKey = queryKeys.markets.communitySuggestions({
    tab: activeTab,
    status: fetchParams.status,
    sort: fetchParams.sort,
    address: fetchParams.address,
  });

  const suggestionsQuery = useQuery({
    queryKey,
    queryFn: () => fetchCommunitySuggestions(fetchParams),
    staleTime: 30_000,
    enabled: activeTab !== "mine" || Boolean(address),
  });

  const suggestions = suggestionsQuery.data ?? [];
  const showMineConnectPrompt = activeTab === "mine" && !address;

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 pb-s64 pt-s48 md:pt-s56">
      <header className="flex flex-col gap-4 border-b border-white/[0.06] pb-r24 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-400/90">
            <Users className="h-3 w-3" aria-hidden />
            Community
          </p>
          <h1 className="text-balance text-2xl font-semibold tracking-tight text-white sm:text-[1.75rem]">
            Community Markets
          </h1>
          <p className="max-w-2xl text-[12.5px] text-zinc-500">
            Propose market ideas and vote on submissions. The most supported ideas are reviewed for
            listing.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowSubmitModal(true)}
          className="inline-flex shrink-0 items-center justify-center rounded-xl bg-cyan-500/15 px-4 py-2.5 text-sm font-semibold text-cyan-100 ring-1 ring-cyan-400/30 transition hover:bg-cyan-500/25"
        >
          Submit Market Idea
        </button>
      </header>

      <div className="flex flex-wrap gap-2 border-b border-white/[0.06] pb-px">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "-mb-px border-b-2 px-4 py-2 text-sm font-semibold transition",
              activeTab === tab.id
                ? "border-cyan-400 text-cyan-200"
                : "border-transparent text-zinc-500 hover:border-white/10 hover:text-zinc-300",
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
            <div key={index} className="h-36 animate-pulse rounded-2xl bg-zinc-800/80" />
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
              queryKey={queryKey}
            />
          ))}
        </div>
      )}

      <SubmitMarketModal
        open={showSubmitModal}
        onOpenChange={setShowSubmitModal}
        onSuccess={() => {
          void suggestionsQuery.refetch();
        }}
      />
    </main>
  );
}
