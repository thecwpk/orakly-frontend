"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
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
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Community Markets</h1>
          <p className="max-w-2xl text-sm text-gray-500">
            Vote for markets you want to see. Top voted markets get approved.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowSubmitModal(true)}
          className="inline-flex shrink-0 items-center justify-center rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
        >
          Submit Market Idea
        </button>
      </header>

      <div className="mb-6 flex flex-wrap gap-2 border-b border-gray-200 pb-px">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "-mb-px border-b-2 px-4 py-2 text-sm font-semibold transition",
              activeTab === tab.id
                ? "border-gray-900 text-gray-900"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-800",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {showMineConnectPrompt ? (
        <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 px-6 py-12 text-center">
          <p className="text-sm font-medium text-gray-500">
            Connect your wallet to view your submissions.
          </p>
        </div>
      ) : suggestionsQuery.isLoading ? (
        <div className="grid gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-36 animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>
      ) : suggestions.length === 0 ? (
        <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 px-6 py-12 text-center">
          <p className="text-sm font-medium text-gray-500">
            No submissions yet. Be the first to submit a market idea!
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
