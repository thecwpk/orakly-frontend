"use client";

import type { ReactNode } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import type { AttentionDashboardItem } from "@/shared/contracts/attention-dashboard";
import {
  fetchAttentionHistory,
  fetchNarrativeMarkets,
} from "@/shared/api/fetchers/narrative-detail";
import { queryKeys } from "@/shared/api/query-keys";
import { cn } from "@/lib/utils";
import {
  MomentumBadge,
  ScoreCell,
  TrendSparkline,
  compareMomentum,
  formatCount,
  formatUsd,
  numericWinner,
  winnerCellClass,
} from "./narrative-wars-ui";

const MARKETS_LIMIT = 5;

type ComparisonTableProps = {
  left: AttentionDashboardItem;
  right: AttentionDashboardItem;
  leftSlug: string;
  rightSlug: string;
};

function ComparisonRow({
  label,
  left,
  right,
  winner,
}: {
  label: string;
  left: ReactNode;
  right: ReactNode;
  winner: "left" | "right" | "tie";
}) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 border-b border-white/[0.06] py-4 last:border-b-0">
      <div className={winnerCellClass("left", winner)}>{left}</div>
      <div className="min-w-[7rem] px-2 text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
        {label}
      </div>
      <div className={winnerCellClass("right", winner)}>{right}</div>
    </div>
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
  const momentumWinner = compareMomentum(left.momentum, right.momentum);
  const volumeWinner = numericWinner(left.volume24hUsd, right.volume24hUsd);
  const liquidityWinner = numericWinner(left.liquidity, right.liquidity);
  const marketsWinner = numericWinner(left.activeMarkets, right.activeMarkets);
  const oiWinner = numericWinner(left.openInterest, right.openInterest);
  const tradersWinner = numericWinner(left.uniqueTraders, right.uniqueTraders);

  return (
    <div className="glass-panel-strong overflow-hidden rounded-2xl px-4 ring-1 ring-white/[0.06] sm:px-6">
      <ComparisonRow
        label="Attention Score"
        winner={attentionWinner}
        left={
          <ScoreCell
            score={left.attentionScore}
            winner={attentionWinner === "left"}
            barClassName="bg-cyan-400"
          />
        }
        right={
          <ScoreCell
            score={right.attentionScore}
            winner={attentionWinner === "right"}
            barClassName="bg-cyan-400"
          />
        }
      />
      <ComparisonRow
        label="Conviction Score"
        winner={convictionWinner}
        left={
          <ScoreCell
            score={left.convictionScore}
            winner={convictionWinner === "left"}
            barClassName="bg-violet-400"
          />
        }
        right={
          <ScoreCell
            score={right.convictionScore}
            winner={convictionWinner === "right"}
            barClassName="bg-violet-400"
          />
        }
      />
      <ComparisonRow
        label="Momentum"
        winner={momentumWinner}
        left={
          <MomentumBadge momentum={left.momentum} winner={momentumWinner === "left"} />
        }
        right={
          <MomentumBadge momentum={right.momentum} winner={momentumWinner === "right"} />
        }
      />
      <ComparisonRow
        label="7-day Trend"
        winner="tie"
        left={
          <TrendSparkline
            data={leftHistoryQ.data?.data ?? []}
            loading={leftHistoryQ.isLoading}
          />
        }
        right={
          <TrendSparkline
            data={rightHistoryQ.data?.data ?? []}
            loading={rightHistoryQ.isLoading}
          />
        }
      />
      <ComparisonRow
        label="Volume 24h"
        winner={volumeWinner}
        left={
          <span
            className={cn(
              "font-mono text-base tabular-nums text-zinc-200",
              volumeWinner === "left" && "font-bold text-emerald-300",
            )}
          >
            {formatUsd(left.volume24hUsd)}
          </span>
        }
        right={
          <span
            className={cn(
              "font-mono text-base tabular-nums",
              volumeWinner === "right" && "font-bold text-emerald-300",
            )}
          >
            {formatUsd(right.volume24hUsd)}
          </span>
        }
      />
      <ComparisonRow
        label="Liquidity"
        winner={liquidityWinner}
        left={
          <span
            className={cn(
              "font-mono text-base tabular-nums",
              liquidityWinner === "left" && "font-bold text-emerald-300",
            )}
          >
            {formatUsd(left.liquidity)}
          </span>
        }
        right={
          <span
            className={cn(
              "font-mono text-base tabular-nums",
              liquidityWinner === "right" && "font-bold text-emerald-300",
            )}
          >
            {formatUsd(right.liquidity)}
          </span>
        }
      />
      <ComparisonRow
        label="Active Markets"
        winner={marketsWinner}
        left={
          <span
            className={cn(
              "font-mono text-base tabular-nums",
              marketsWinner === "left" && "font-bold text-emerald-300",
            )}
          >
            {formatCount(left.activeMarkets)}
          </span>
        }
        right={
          <span
            className={cn(
              "font-mono text-base tabular-nums",
              marketsWinner === "right" && "font-bold text-emerald-300",
            )}
          >
            {formatCount(right.activeMarkets)}
          </span>
        }
      />
      <ComparisonRow
        label="Open Interest"
        winner={oiWinner}
        left={
          <span
            className={cn(
              "font-mono text-base tabular-nums",
              oiWinner === "left" && "font-bold text-emerald-300",
            )}
          >
            {formatUsd(left.openInterest)}
          </span>
        }
        right={
          <span
            className={cn(
              "font-mono text-base tabular-nums",
              oiWinner === "right" && "font-bold text-emerald-300",
            )}
          >
            {formatUsd(right.openInterest)}
          </span>
        }
      />
      <ComparisonRow
        label="Unique Traders"
        winner={tradersWinner}
        left={
          <span
            className={cn(
              "font-mono text-base tabular-nums",
              tradersWinner === "left" && "font-bold text-emerald-300",
            )}
          >
            {formatCount(left.uniqueTraders)}
          </span>
        }
        right={
          <span
            className={cn(
              "font-mono text-base tabular-nums",
              tradersWinner === "right" && "font-bold text-emerald-300",
            )}
          >
            {formatCount(right.uniqueTraders)}
          </span>
        }
      />
    </div>
  );
}

type MarketsColumnProps = {
  slug: string;
  title: string;
};

function MarketsColumn({ slug, title }: MarketsColumnProps) {
  const { data: markets = [], isLoading } = useQuery({
    queryKey: queryKeys.hub.narrativeMarkets(slug, MARKETS_LIMIT),
    queryFn: () => fetchNarrativeMarkets(slug, MARKETS_LIMIT),
    staleTime: 45_000,
    enabled: Boolean(slug),
  });

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-zinc-100">{title}</h3>
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-14 animate-pulse rounded-lg bg-zinc-800/80" />
          ))}
        </div>
      ) : markets.length === 0 ? (
        <p className="rounded-lg border border-dashed border-white/[0.1] bg-white/[0.02] px-3 py-6 text-center text-sm text-zinc-500">
          No markets found.
        </p>
      ) : (
        <ul className="space-y-2">
          {markets.slice(0, MARKETS_LIMIT).map((market) => {
            const yesPct = Math.round((market.probability ?? 0.5) * 100);
            return (
              <li
                key={market.id}
                className="rounded-lg bg-white/[0.03] px-3 py-2.5 ring-1 ring-white/[0.06]"
              >
                <p className="line-clamp-2 text-sm font-medium text-zinc-100">
                  {market.title}
                </p>
                <div className="mt-1.5 flex items-center justify-between gap-2 text-xs text-zinc-500">
                  <span className="font-mono tabular-nums">
                    Vol {formatUsd(market.volumeUsd)}
                  </span>
                  <span className="font-mono font-semibold tabular-nums text-cyan-200">
                    {yesPct}%
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
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
  return (
    <section className="space-y-4">
      <h2 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
        Top markets
      </h2>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <MarketsColumn slug={leftSlug} title={leftName} />
        <MarketsColumn slug={rightSlug} title={rightName} />
      </div>
    </section>
  );
}
