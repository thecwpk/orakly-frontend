"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useQueries } from "@tanstack/react-query";
import type { AttentionDashboardItem } from "@/shared/contracts/attention-dashboard";
import {
  fetchAttentionHistory,
  fetchNarrativeMarkets,
} from "@/shared/api/fetchers/narrative-detail";
import { queryKeys } from "@/shared/api/query-keys";
import { ROUTES } from "@/shared/constants/routes";
import { formatCompactUsd } from "@orakly/utils";
import { cn } from "@/lib/utils";
import {
  MomentumBadge,
  ScoreGaugeCell,
  TrendSparkline,
  formatCount,
  formatUsd,
  numericWinner,
  winnerTextClass,
} from "./narrative-wars-ui";

const MARKETS_LIMIT = 5;

type ComparisonTableProps = {
  left: AttentionDashboardItem;
  right: AttentionDashboardItem;
  leftSlug: string;
  rightSlug: string;
};

function MetricRow({
  label,
  left,
  right,
  winner,
  skipWinner,
}: {
  label: string;
  left: ReactNode;
  right: ReactNode;
  winner: "left" | "right" | "tie";
  skipWinner?: boolean;
}) {
  return (
    <tr className="border-b border-white/[0.06] last:border-b-0">
      <td className="px-4 py-3.5 text-[12px] font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </td>
      <td
        className={cn(
          "px-4 py-3.5",
          !skipWinner && winnerTextClass("left", winner),
        )}
      >
        {left}
      </td>
      <td
        className={cn(
          "px-4 py-3.5",
          !skipWinner && winnerTextClass("right", winner),
        )}
      >
        {right}
      </td>
    </tr>
  );
}

export function NarrativeWarsComparisonTable({
  left,
  right,
  leftSlug,
  rightSlug,
}: ComparisonTableProps) {
  const [leftHistoryQ, rightHistoryQ] = useQueries({
    queries: [
      {
        queryKey: queryKeys.hub.attentionHistory(leftSlug, "7d"),
        queryFn: () => fetchAttentionHistory(leftSlug, "7d"),
        staleTime: 60_000,
      },
      {
        queryKey: queryKeys.hub.attentionHistory(rightSlug, "7d"),
        queryFn: () => fetchAttentionHistory(rightSlug, "7d"),
        staleTime: 60_000,
      },
    ],
  });

  const attentionWinner = numericWinner(left.attentionScore, right.attentionScore);
  const convictionWinner = numericWinner(left.convictionScore, right.convictionScore);
  const volumeWinner = numericWinner(left.volume24hUsd, right.volume24hUsd);
  const marketsWinner = numericWinner(left.activeMarkets, right.activeMarkets);
  const oiWinner = numericWinner(left.openInterest, right.openInterest);
  const tradersWinner = numericWinner(left.uniqueTraders, right.uniqueTraders);

  return (
    <div className="overflow-x-auto rounded-2xl border border-white/[0.08] bg-zinc-950/40">
      <table className="w-full min-w-[640px] text-left">
        <thead>
          <tr className="border-b border-white/[0.08] bg-white/[0.03]">
            <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Metric
            </th>
            <th className="px-4 py-3 text-[14px] font-bold text-zinc-100">
              {left.narrativeName}
            </th>
            <th className="px-4 py-3 text-[14px] font-bold text-zinc-100">
              {right.narrativeName}
            </th>
          </tr>
        </thead>
        <tbody>
          <MetricRow
            label="Attention Score"
            winner={attentionWinner}
            left={
              <ScoreGaugeCell
                score={left.attentionScore}
                winner={attentionWinner === "left"}
              />
            }
            right={
              <ScoreGaugeCell
                score={right.attentionScore}
                winner={attentionWinner === "right"}
              />
            }
          />
          <MetricRow
            label="Conviction Score"
            winner={convictionWinner}
            left={
              <ScoreGaugeCell
                score={left.convictionScore}
                winner={convictionWinner === "left"}
              />
            }
            right={
              <ScoreGaugeCell
                score={right.convictionScore}
                winner={convictionWinner === "right"}
              />
            }
          />
          <MetricRow
            label="Volume (24h)"
            winner={volumeWinner}
            left={
              <span className="font-mono text-[15px] tabular-nums">
                {formatUsd(left.volume24hUsd)}
              </span>
            }
            right={
              <span className="font-mono text-[15px] tabular-nums">
                {formatUsd(right.volume24hUsd)}
              </span>
            }
          />
          <MetricRow
            label="Active Markets"
            winner={marketsWinner}
            left={
              <span className="font-mono text-[15px] tabular-nums">
                {formatCount(left.activeMarkets)}
              </span>
            }
            right={
              <span className="font-mono text-[15px] tabular-nums">
                {formatCount(right.activeMarkets)}
              </span>
            }
          />
          <MetricRow
            label="Open Interest"
            winner={oiWinner}
            left={
              <span className="font-mono text-[15px] tabular-nums">
                {formatUsd(left.openInterest)}
              </span>
            }
            right={
              <span className="font-mono text-[15px] tabular-nums">
                {formatUsd(right.openInterest)}
              </span>
            }
          />
          <MetricRow
            label="Unique Traders"
            winner={tradersWinner}
            left={
              <span className="font-mono text-[15px] tabular-nums">
                {formatCount(left.uniqueTraders)}
              </span>
            }
            right={
              <span className="font-mono text-[15px] tabular-nums">
                {formatCount(right.uniqueTraders)}
              </span>
            }
          />
          <MetricRow
            label="Momentum"
            winner="tie"
            skipWinner
            left={<MomentumBadge momentum={left.momentum} />}
            right={<MomentumBadge momentum={right.momentum} />}
          />
          <tr className="border-b-0">
            <td className="px-4 py-3.5 text-[12px] font-semibold uppercase tracking-wider text-zinc-500">
              7-Day Trend
            </td>
            <td className="px-4 py-3.5">
              <TrendSparkline
                data={leftHistoryQ.data?.data ?? []}
                loading={leftHistoryQ.isLoading}
                stroke="#34d399"
              />
            </td>
            <td className="px-4 py-3.5">
              <TrendSparkline
                data={rightHistoryQ.data?.data ?? []}
                loading={rightHistoryQ.isLoading}
                stroke="#fb7185"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

type NarrativeWarsMarketsProps = {
  leftSlug: string;
  rightSlug: string;
  leftName: string;
  rightName: string;
};

export function NarrativeWarsMarkets({
  leftSlug,
  rightSlug,
  leftName,
  rightName,
}: NarrativeWarsMarketsProps) {
  const [leftMarketsQ, rightMarketsQ] = useQueries({
    queries: [
      {
        queryKey: ["narrative-war-markets", leftSlug, MARKETS_LIMIT],
        queryFn: () => fetchNarrativeMarkets(leftSlug, MARKETS_LIMIT),
        staleTime: 30_000,
      },
      {
        queryKey: ["narrative-war-markets", rightSlug, MARKETS_LIMIT],
        queryFn: () => fetchNarrativeMarkets(rightSlug, MARKETS_LIMIT),
        staleTime: 30_000,
      },
    ],
  });

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <MarketColumn
        title={`Markets in ${leftName}`}
        markets={leftMarketsQ.data ?? []}
        loading={leftMarketsQ.isLoading}
      />
      <MarketColumn
        title={`Markets in ${rightName}`}
        markets={rightMarketsQ.data ?? []}
        loading={rightMarketsQ.isLoading}
      />
    </div>
  );
}

function MarketColumn({
  title,
  markets,
  loading,
}: {
  title: string;
  markets: Awaited<ReturnType<typeof fetchNarrativeMarkets>>;
  loading: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-zinc-950/40 p-4">
      <h3 className="mb-3 text-[14px] font-semibold text-zinc-100">{title}</h3>
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-zinc-800/60" />
          ))}
        </div>
      ) : markets.length === 0 ? (
        <p className="py-6 text-center text-[13px] text-zinc-500">No open markets</p>
      ) : (
        <ul className="space-y-2">
          {markets.slice(0, MARKETS_LIMIT).map((m) => (
            <li key={m.id}>
              <Link
                href={ROUTES.market(m.slug)}
                className="flex items-start justify-between gap-3 rounded-xl px-2 py-2 transition hover:bg-white/[0.04]"
              >
                <span className="line-clamp-2 text-[13px] font-medium text-zinc-200">
                  {m.title}
                </span>
                <span className="shrink-0 font-mono text-[12px] tabular-nums text-zinc-400">
                  {formatCompactUsd(m.volumeUsd ?? 0)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
