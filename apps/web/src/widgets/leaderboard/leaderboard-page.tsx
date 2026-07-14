"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { LeaderboardAvatar } from "@/features/leaderboard/components/leaderboard-avatar";
import { compactUsd, shortAddress } from "@/features/leaderboard/lib/format";
import { cn } from "@/lib/utils";
import {
  fetchCreatorLeaderboardPage,
  fetchTraderLeaderboardPage,
  type CreatorLeaderboardRowDto,
  type LeaderboardPeriod,
  type TraderLeaderboardRowDto,
  type TraderLeaderboardSort,
} from "@/shared/api/fetchers/leaderboard";
import { ROUTES } from "@/shared/constants/routes";

type LeaderboardTab =
  | "traders"
  | "creators"
  | "accuracy"
  | "profit"
  | "volume";

const PERIODS: { id: LeaderboardPeriod; label: string }[] = [
  { id: "all", label: "All Time" },
  { id: "month", label: "This Month" },
  { id: "week", label: "This Week" },
];

const TABS: { id: LeaderboardTab; label: string }[] = [
  { id: "traders", label: "Top Traders" },
  { id: "creators", label: "Top Creators" },
  { id: "accuracy", label: "Highest Accuracy" },
  { id: "profit", label: "Highest Profit" },
  { id: "volume", label: "Highest Volume" },
];

const LIMIT = 50;

function tabSort(tab: LeaderboardTab): TraderLeaderboardSort {
  if (tab === "accuracy") return "accuracy";
  if (tab === "profit") return "profit";
  return "volume";
}

function tabMinTrades(tab: LeaderboardTab): number {
  return tab === "accuracy" ? 5 : 0;
}

function formatBnb(n: number): string {
  if (!Number.isFinite(n) || n === 0) return "0 BNB";
  const abs = Math.abs(n);
  const sign = n < 0 ? "−" : "";
  if (abs >= 1_000) return `${sign}${(abs / 1_000).toFixed(1)}k BNB`;
  if (abs >= 100) return `${sign}${abs.toFixed(0)} BNB`;
  return `${sign}${abs.toFixed(2)} BNB`;
}

function formatScore(score: number | null | undefined): string {
  if (score == null || !Number.isFinite(score)) return "—";
  if (score >= 1_000) return `${(score / 1_000).toFixed(1)}k`;
  return score.toFixed(score >= 10 ? 0 : 1);
}

function formatActiveSince(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return "—";
  }
}

function RankCell({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span className="inline-flex h-8 w-10 items-center justify-center rounded-lg bg-amber-400/25 text-lg ring-1 ring-amber-300/40">
        🥇
      </span>
    );
  }
  if (rank === 2) {
    return (
      <span className="inline-flex h-8 w-10 items-center justify-center rounded-lg bg-zinc-300/20 text-lg ring-1 ring-zinc-200/30">
        🥈
      </span>
    );
  }
  if (rank === 3) {
    return (
      <span className="inline-flex h-8 w-10 items-center justify-center rounded-lg bg-orange-500/20 text-lg ring-1 ring-orange-400/30">
        🥉
      </span>
    );
  }
  return (
    <span className="inline-flex h-8 w-10 items-center justify-center font-mono text-[13px] font-semibold tabular-nums text-zinc-400">
      {rank}
    </span>
  );
}

function WalletCell({ address }: { address: string }) {
  return (
    <Link
      href={ROUTES.traderProfile(address)}
      className="inline-flex min-w-0 items-center gap-2.5 transition hover:opacity-90"
    >
      <LeaderboardAvatar address={address} className="h-8 w-8 rounded-full" />
      <span className="truncate font-mono text-[13px] tabular-nums text-zinc-100">
        {shortAddress(address)}
      </span>
    </Link>
  );
}

function ActionsCell({ address }: { address: string }) {
  return (
    <Link
      href={ROUTES.traderProfile(address)}
      className="text-[12px] font-semibold text-blue-300 transition hover:text-blue-200"
    >
      View →
    </Link>
  );
}

function TableShell({
  headers,
  note,
  children,
  footer,
  yourRank,
}: {
  headers: string[];
  note?: string;
  children: ReactNode;
  footer: ReactNode;
  yourRank: ReactNode;
}) {
  return (
    <div className="space-y-3">
      {note ? <p className="text-[12px] text-zinc-500">{note}</p> : null}
      <div className="overflow-hidden rounded-2xl border border-white/[0.08]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left text-[13px]">
            <thead className="border-b border-white/[0.06] bg-white/[0.02] text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              <tr>
                {headers.map((header) => (
                  <th
                    key={header}
                    className={cn(
                      "px-4 py-3",
                      header === "Actions" && "text-right",
                    )}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">{children}</tbody>
          </table>
        </div>
        {yourRank}
      </div>
      {footer}
    </div>
  );
}

function parseVol(row: TraderLeaderboardRowDto): number {
  return Number.parseFloat(row.totalVolumeUsd) || 0;
}

function parsePnl(row: TraderLeaderboardRowDto): number {
  return Number.parseFloat(row.pnlUsd) || 0;
}

function TradersTable({
  rows,
  yourRank,
  footer,
}: {
  rows: TraderLeaderboardRowDto[];
  yourRank: ReactNode;
  footer: ReactNode;
}) {
  return (
    <TableShell
      headers={[
        "Rank",
        "Wallet",
        "Accuracy %",
        "Markets Traded",
        "Profit (BNB)",
        "Creator Score",
        "Actions",
      ]}
      yourRank={yourRank}
      footer={footer}
    >
      {rows.map((row, index) => {
        const address = row.walletAddress ?? row.userId;
        return (
          <tr key={row.userId} className="hover:bg-white/[0.02]">
            <td className="px-4 py-3">
              <RankCell rank={index + 1} />
            </td>
            <td className="px-4 py-3">
              <WalletCell address={address} />
            </td>
            <td className="px-4 py-3 font-mono tabular-nums text-zinc-300">
              {row.winRatePct.toFixed(1)}%
            </td>
            <td className="px-4 py-3 font-mono tabular-nums text-zinc-300">
              {row.marketsTraded}
            </td>
            <td
              className={cn(
                "px-4 py-3 font-mono tabular-nums",
                parsePnl(row) >= 0 ? "text-emerald-300" : "text-rose-300",
              )}
            >
              {formatBnb(parsePnl(row))}
            </td>
            <td className="px-4 py-3 font-mono tabular-nums text-zinc-300">
              {formatScore(row.creatorScore)}
            </td>
            <td className="px-4 py-3 text-right">
              <ActionsCell address={address} />
            </td>
          </tr>
        );
      })}
    </TableShell>
  );
}

function CreatorsTable({
  rows,
  yourRank,
  footer,
}: {
  rows: CreatorLeaderboardRowDto[];
  yourRank: ReactNode;
  footer: ReactNode;
}) {
  return (
    <TableShell
      headers={[
        "Rank",
        "Wallet",
        "Approved Markets",
        "Volume Generated",
        "Fees Earned",
        "Creator Score",
        "Actions",
      ]}
      yourRank={yourRank}
      footer={footer}
    >
      {rows.map((row, index) => (
        <tr key={row.creatorAddress} className="hover:bg-white/[0.02]">
          <td className="px-4 py-3">
            <RankCell rank={index + 1} />
          </td>
          <td className="px-4 py-3">
            <WalletCell address={row.creatorAddress} />
          </td>
          <td className="px-4 py-3 font-mono tabular-nums text-zinc-300">
            {row.marketCount}
          </td>
          <td className="px-4 py-3 font-mono tabular-nums text-zinc-300">
            {compactUsd(row.totalVolumeUsd)}
          </td>
          <td className="px-4 py-3 font-mono tabular-nums text-emerald-300">
            {formatBnb(row.feesEarned)}
          </td>
          <td className="px-4 py-3 font-mono tabular-nums text-zinc-100">
            {formatScore(row.creatorScore)}
          </td>
          <td className="px-4 py-3 text-right">
            <ActionsCell address={row.creatorAddress} />
          </td>
        </tr>
      ))}
    </TableShell>
  );
}

function AccuracyTable({
  rows,
  yourRank,
  footer,
}: {
  rows: TraderLeaderboardRowDto[];
  yourRank: ReactNode;
  footer: ReactNode;
}) {
  return (
    <TableShell
      headers={[
        "Rank",
        "Wallet",
        "Accuracy %",
        "Total Trades",
        "Volume",
        "Profit",
        "Actions",
      ]}
      note="Minimum qualifier: 5 trades"
      yourRank={yourRank}
      footer={footer}
    >
      {rows.map((row, index) => {
        const address = row.walletAddress ?? row.userId;
        return (
          <tr key={row.userId} className="hover:bg-white/[0.02]">
            <td className="px-4 py-3">
              <RankCell rank={index + 1} />
            </td>
            <td className="px-4 py-3">
              <WalletCell address={address} />
            </td>
            <td className="px-4 py-3 font-mono tabular-nums font-semibold text-zinc-100">
              {row.winRatePct.toFixed(1)}%
            </td>
            <td className="px-4 py-3 font-mono tabular-nums text-zinc-300">
              {row.tradeCount}
            </td>
            <td className="px-4 py-3 font-mono tabular-nums text-zinc-300">
              {compactUsd(parseVol(row))}
            </td>
            <td
              className={cn(
                "px-4 py-3 font-mono tabular-nums",
                parsePnl(row) >= 0 ? "text-emerald-300" : "text-rose-300",
              )}
            >
              {formatBnb(parsePnl(row))}
            </td>
            <td className="px-4 py-3 text-right">
              <ActionsCell address={address} />
            </td>
          </tr>
        );
      })}
    </TableShell>
  );
}

function ProfitTable({
  rows,
  yourRank,
  footer,
}: {
  rows: TraderLeaderboardRowDto[];
  yourRank: ReactNode;
  footer: ReactNode;
}) {
  return (
    <TableShell
      headers={[
        "Rank",
        "Wallet",
        "Total Profit (BNB)",
        "Best Single Trade",
        "Markets Traded",
        "Win Rate",
        "Actions",
      ]}
      yourRank={yourRank}
      footer={footer}
    >
      {rows.map((row, index) => {
        const address = row.walletAddress ?? row.userId;
        return (
          <tr key={row.userId} className="hover:bg-white/[0.02]">
            <td className="px-4 py-3">
              <RankCell rank={index + 1} />
            </td>
            <td className="px-4 py-3">
              <WalletCell address={address} />
            </td>
            <td
              className={cn(
                "px-4 py-3 font-mono tabular-nums font-semibold",
                parsePnl(row) >= 0 ? "text-emerald-300" : "text-rose-300",
              )}
            >
              {formatBnb(parsePnl(row))}
            </td>
            <td className="px-4 py-3 font-mono tabular-nums text-zinc-300">
              {compactUsd(row.bestTradeUsd)}
            </td>
            <td className="px-4 py-3 font-mono tabular-nums text-zinc-300">
              {row.marketsTraded}
            </td>
            <td className="px-4 py-3 font-mono tabular-nums text-zinc-300">
              {row.winRatePct.toFixed(1)}%
            </td>
            <td className="px-4 py-3 text-right">
              <ActionsCell address={address} />
            </td>
          </tr>
        );
      })}
    </TableShell>
  );
}

function VolumeTable({
  rows,
  yourRank,
  footer,
}: {
  rows: TraderLeaderboardRowDto[];
  yourRank: ReactNode;
  footer: ReactNode;
}) {
  return (
    <TableShell
      headers={[
        "Rank",
        "Wallet",
        "Total Volume",
        "Trades",
        "Avg Trade Size",
        "Active Since",
        "Actions",
      ]}
      yourRank={yourRank}
      footer={footer}
    >
      {rows.map((row, index) => {
        const address = row.walletAddress ?? row.userId;
        const avg =
          row.avgTradeSizeUsd ??
          (row.tradeCount > 0 ? parseVol(row) / row.tradeCount : 0);
        return (
          <tr key={row.userId} className="hover:bg-white/[0.02]">
            <td className="px-4 py-3">
              <RankCell rank={index + 1} />
            </td>
            <td className="px-4 py-3">
              <WalletCell address={address} />
            </td>
            <td className="px-4 py-3 font-mono tabular-nums font-semibold text-zinc-100">
              {compactUsd(parseVol(row))}
            </td>
            <td className="px-4 py-3 font-mono tabular-nums text-zinc-300">
              {row.tradeCount}
            </td>
            <td className="px-4 py-3 font-mono tabular-nums text-zinc-300">
              {compactUsd(avg)}
            </td>
            <td className="px-4 py-3 tabular-nums text-zinc-400">
              {formatActiveSince(row.activeSince)}
            </td>
            <td className="px-4 py-3 text-right">
              <ActionsCell address={address} />
            </td>
          </tr>
        );
      })}
    </TableShell>
  );
}

function YourRankBar({
  connected,
  address,
  rankLabel,
  summary,
  onConnect,
}: {
  connected: boolean;
  address: string | null;
  rankLabel: string;
  summary?: string | null;
  onConnect: () => void;
}) {
  return (
    <div className="sticky bottom-0 border-t border-blue-400/25 bg-blue-600/20 px-4 py-3 backdrop-blur-md">
      {!connected ? (
        <button
          type="button"
          onClick={onConnect}
          className="text-sm font-semibold text-blue-100 underline-offset-2 hover:underline"
        >
          Connect wallet to see your rank
        </button>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            {address ? (
              <WalletCell address={address} />
            ) : null}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-blue-50">{rankLabel}</p>
              {summary ? (
                <p className="mt-0.5 text-[12px] text-blue-100/70">{summary}</p>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function LeaderboardPage() {
  const [period, setPeriod] = useState<LeaderboardPeriod>("all");
  const [tab, setTab] = useState<LeaderboardTab>("traders");
  const { address } = useAccount();
  const { openConnectModal } = useConnectModal();

  const isCreators = tab === "creators";
  const sort = tabSort(tab);
  const minTrades = tabMinTrades(tab);

  const tradersQuery = useQuery({
    queryKey: ["leaderboard", "traders", period, sort, minTrades, address ?? ""] as const,
    queryFn: () =>
      fetchTraderLeaderboardPage({
        period,
        sort,
        limit: LIMIT,
        minTrades,
        address: address ?? undefined,
      }),
    enabled: !isCreators,
    staleTime: 30_000,
  });

  const creatorsQuery = useQuery({
    queryKey: ["leaderboard", "creators", period, address ?? ""] as const,
    queryFn: () =>
      fetchCreatorLeaderboardPage({
        limit: LIMIT,
        period,
        sort: "fees",
        address: address ?? undefined,
      }),
    enabled: isCreators,
    staleTime: 30_000,
  });

  const isLoading = isCreators ? creatorsQuery.isLoading : tradersQuery.isLoading;
  const traderRows = tradersQuery.data?.rows ?? [];
  const creatorRows = creatorsQuery.data?.rows ?? [];
  const total = isCreators
    ? (creatorsQuery.data?.total ?? 0)
    : (tradersQuery.data?.total ?? 0);

  const yourRankLabel = useMemo(() => {
    if (!address) return "";
    if (isCreators) {
      const viewer = creatorsQuery.data?.viewer;
      if (viewer?.rank != null) return `Your rank: #${viewer.rank}`;
      return "Unranked";
    }
    const viewer = tradersQuery.data?.viewer;
    if (tab === "accuracy" && viewer && !viewer.qualifies) {
      return "Unranked (need 5+ trades)";
    }
    if (viewer?.rank != null) return `Your rank: #${viewer.rank}`;
    if (viewer && viewer.tradeCount > 0 && tab === "accuracy") {
      return "Unranked (need 5+ trades)";
    }
    return "Unranked";
  }, [address, isCreators, creatorsQuery.data, tradersQuery.data, tab]);

  const yourRankSummary = useMemo(() => {
    if (!address) return null;
    if (isCreators) {
      const row = creatorsQuery.data?.viewer?.row;
      if (!row) return null;
      return `${row.marketCount} markets · ${compactUsd(row.totalVolumeUsd)} vol · ${formatBnb(row.feesEarned)} fees`;
    }
    const row = tradersQuery.data?.viewer?.row;
    if (!row) return null;
    if (tab === "accuracy") {
      return `${row.winRatePct.toFixed(1)}% accuracy · ${row.tradeCount} trades · ${compactUsd(parseVol(row))} vol`;
    }
    if (tab === "profit") {
      return `${formatBnb(parsePnl(row))} profit · ${row.marketsTraded} markets · ${row.winRatePct.toFixed(1)}% win rate`;
    }
    if (tab === "volume") {
      const avg =
        row.avgTradeSizeUsd ??
        (row.tradeCount > 0 ? parseVol(row) / row.tradeCount : 0);
      return `${compactUsd(parseVol(row))} vol · ${row.tradeCount} trades · avg ${compactUsd(avg)}`;
    }
    return `${row.winRatePct.toFixed(1)}% accuracy · ${row.marketsTraded} markets · ${formatBnb(parsePnl(row))}`;
  }, [address, isCreators, creatorsQuery.data, tradersQuery.data, tab]);

  const yourRank = (
    <YourRankBar
      connected={Boolean(address)}
      address={address ?? null}
      rankLabel={yourRankLabel}
      summary={yourRankSummary}
      onConnect={() => openConnectModal?.()}
    />
  );

  const footer = (
    <p className="text-[12px] text-zinc-500">
      Showing top {Math.min(LIMIT, isCreators ? creatorRows.length : traderRows.length)} of{" "}
      {total} total {isCreators ? "creators" : "traders"}
    </p>
  );

  const empty = (
    <div className="overflow-hidden rounded-2xl border border-dashed border-white/[0.1]">
      <div className="flex min-h-[180px] items-center justify-center bg-white/[0.02] px-6 py-12 text-center">
        <p className="text-sm font-medium text-zinc-400">No rankings yet for this period</p>
      </div>
      {yourRank}
    </div>
  );

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 pb-16 pt-10 md:pt-12">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <h1 className="text-[32px] font-bold leading-tight tracking-tight text-white">
            Leaderboard
          </h1>
          <p className="text-[14px] text-zinc-500">Top performers on Orakly</p>
        </div>
        <div className="inline-flex shrink-0 rounded-xl border border-white/[0.08] bg-zinc-950/60 p-1">
          {PERIODS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setPeriod(item.id)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-[12px] font-semibold transition",
                period === item.id
                  ? "bg-blue-600 text-white"
                  : "text-zinc-400 hover:text-zinc-200",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      <div className="flex flex-wrap gap-2 border-b border-white/[0.06]">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              "-mb-px border-b-2 px-3.5 py-2.5 text-sm font-semibold transition",
              tab === item.id
                ? "border-blue-500 text-blue-200"
                : "border-transparent text-zinc-500 hover:border-white/10 hover:text-zinc-300",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="h-72 animate-pulse rounded-2xl bg-zinc-800/80" />
      ) : isCreators ? (
        creatorRows.length === 0 ? (
          empty
        ) : (
          <CreatorsTable rows={creatorRows} yourRank={yourRank} footer={footer} />
        )
      ) : traderRows.length === 0 ? (
        empty
      ) : tab === "traders" ? (
        <TradersTable rows={traderRows} yourRank={yourRank} footer={footer} />
      ) : tab === "accuracy" ? (
        <AccuracyTable rows={traderRows} yourRank={yourRank} footer={footer} />
      ) : tab === "profit" ? (
        <ProfitTable rows={traderRows} yourRank={yourRank} footer={footer} />
      ) : (
        <VolumeTable rows={traderRows} yourRank={yourRank} footer={footer} />
      )}
    </main>
  );
}
