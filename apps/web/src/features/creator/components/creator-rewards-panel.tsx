"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { useCreatorStatsQuery } from "@/shared/api/hooks/useCreatorStatsQuery";
import type { CreatorProfileMarket } from "@/shared/contracts/creator-profile";

export interface CreatorRewardsPanelProps {
  address: string;
}

const compactUsd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

function formatUsd(value: number): string {
  if (!Number.isFinite(value)) return "$0";
  return compactUsd.format(value);
}

function truncateQuestion(text: string, max = 60): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

function statusBadgeClass(status: string): string {
  const normalized = status.toUpperCase();
  if (normalized === "OPEN") {
    return "bg-blue-100 text-blue-700 ring-blue-200";
  }
  if (normalized === "RESOLVED") {
    return "bg-gray-100 text-gray-600 ring-gray-200";
  }
  if (normalized === "PENDING") {
    return "bg-amber-100 text-amber-800 ring-amber-200";
  }
  return "bg-gray-100 text-gray-600 ring-gray-200";
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={`stat-skeleton-${index}`}
            className="h-24 animate-pulse rounded-xl bg-gray-200"
          />
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={`row-skeleton-${index}`}
            className="h-12 animate-pulse rounded-lg bg-gray-200"
          />
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
        statusBadgeClass(status),
      )}
    >
      {status.toUpperCase()}
    </span>
  );
}

function MarketsTable({ markets }: { markets: CreatorProfileMarket[] }) {
  const sorted = useMemo(
    () => [...markets].sort((a, b) => b.feesEarned - a.feesEarned),
    [markets],
  );

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left font-semibold text-gray-600">Market Question</th>
            <th className="px-4 py-3 text-right font-semibold text-gray-600">Volume</th>
            <th className="px-4 py-3 text-right font-semibold text-gray-600">Fee %</th>
            <th className="px-4 py-3 text-right font-semibold text-gray-600">Fees Earned</th>
            <th className="px-4 py-3 text-right font-semibold text-gray-600">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {sorted.map((market) => (
            <tr key={market.id} className="hover:bg-gray-50">
              <td className="max-w-[320px] px-4 py-3 font-medium text-gray-900">
                {truncateQuestion(market.question)}
              </td>
              <td className="px-4 py-3 text-right text-gray-700">{formatUsd(market.volume)}</td>
              <td className="px-4 py-3 text-right text-gray-700">
                {market.creatorRewardPercent}%
              </td>
              <td className="px-4 py-3 text-right font-semibold text-gray-900">
                {formatUsd(market.feesEarned)}
              </td>
              <td className="px-4 py-3 text-right">
                <StatusBadge status={market.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CreatorRewardsPanel({ address }: CreatorRewardsPanelProps) {
  const { data, isLoading, isError, error, refetch, isFetching } = useCreatorStatsQuery(address);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-6 text-center">
        <p className="text-sm font-medium text-red-700">
          {error?.message ?? "Failed to load creator stats."}
        </p>
        <button
          type="button"
          onClick={() => void refetch()}
          disabled={isFetching}
          className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
        >
          {isFetching ? "Retrying…" : "Retry"}
        </button>
      </div>
    );
  }

  if (!data?.isCreator) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white px-6 py-10 text-center">
        <p className="text-sm text-gray-600">This wallet has no approved markets yet.</p>
      </div>
    );
  }

  const rankLabel =
    data.creatorRank != null ? `#${data.creatorRank}` : "Unranked";

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Markets Created" value={String(data.approvedMarkets)} />
        <StatCard label="Total Volume Generated" value={formatUsd(data.totalVolumeGenerated)} />
        <StatCard label="Total Fees Earned" value={formatUsd(data.totalFeesEarned)} />
        <StatCard label="Creator Rank" value={rankLabel} />
      </div>

      <MarketsTable markets={data.markets} />

      <div className="flex justify-end">
        <button
          type="button"
          disabled
          title="Rewards are distributed automatically on market resolution"
          className="cursor-not-allowed rounded-lg bg-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-500"
        >
          Claim Rewards
        </button>
      </div>
    </div>
  );
}
