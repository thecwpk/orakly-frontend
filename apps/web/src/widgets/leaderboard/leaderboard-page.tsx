"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { Medal, Trophy } from "lucide-react";
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

const GRID: Record<LeaderboardTab, string> = {
  traders: "grid-cols-[64px_minmax(140px,1.4fr)_repeat(4,minmax(72px,1fr))_72px]",
  creators: "grid-cols-[64px_minmax(140px,1.4fr)_repeat(4,minmax(72px,1fr))_72px]",
  accuracy: "grid-cols-[64px_minmax(140px,1.4fr)_repeat(4,minmax(72px,1fr))_72px]",
  profit: "grid-cols-[64px_minmax(140px,1.4fr)_repeat(4,minmax(72px,1fr))_72px]",
  volume: "grid-cols-[64px_minmax(140px,1.4fr)_repeat(4,minmax(72px,1fr))_72px]",
};

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
  if (score == null || !Number.isFinite(score)) return "N/A";
  if (score >= 1_000) return `${(score / 1_000).toFixed(1)}k`;
  return score.toFixed(score >= 10 ? 0 : 1);
}

function formatActiveSince(iso: string | null | undefined): string {
  if (!iso) return "N/A";
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return "N/A";
  }
}

function parseVol(row: TraderLeaderboardRowDto): number {
  return Number.parseFloat(row.totalVolumeUsd) || 0;
}

function parsePnl(row: TraderLeaderboardRowDto): number {
  return Number.parseFloat(row.pnlUsd) || 0;
}

function avatarColorFromAddress(addr: string): string {
  const cleaned = addr.replace(/^0x/i, "").replace(/[^0-9a-fA-F]/g, "");
  const hex = `${cleaned}000000`.slice(0, 6);
  return `#${hex}`;
}

function avatarInitials(addr: string): string {
  const cleaned = addr.replace(/^0x/i, "");
  return (cleaned.slice(0, 2) || "??").toUpperCase();
}

function RankCell({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span className="inline-flex items-center gap-1 text-lg font-black text-amber-400">
        1 <Medal className="size-4" aria-hidden />
      </span>
    );
  }
  if (rank === 2) {
    return (
      <span className="inline-flex items-center gap-1 font-black text-[var(--foreground)]">
        2 <Medal className="size-4" aria-hidden />
      </span>
    );
  }
  if (rank === 3) {
    return (
      <span className="inline-flex items-center gap-1 font-black text-amber-600">
        3 <Medal className="size-4" aria-hidden />
      </span>
    );
  }
  return <span className="text-sm font-bold text-[var(--foreground-muted)]">{rank}</span>;
}

function WalletCell({ address }: { address: string }) {
  return (
    <Link
      href={ROUTES.traderProfile(address)}
      className="inline-flex min-w-0 items-center gap-2.5 transition hover:opacity-90"
    >
      <span
        className="flex size-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
        style={{ backgroundColor: avatarColorFromAddress(address) }}
        aria-hidden
      >
        {avatarInitials(address)}
      </span>
      <span className="truncate font-mono text-sm text-[var(--foreground)]">
        {shortAddress(address)}
      </span>
    </Link>
  );
}

function Cell({
  children,
  className,
  align = "left",
}: {
  children: ReactNode;
  className?: string;
  align?: "left" | "right";
}) {
  return (
    <div
      className={cn(
        "min-w-0 text-sm font-medium text-[var(--foreground)]",
        align === "right" && "text-right",
        className,
      )}
    >
      {children}
    </div>
  );
}

function GridHeader({
  labels,
  gridClass,
}: {
  labels: string[];
  gridClass: string;
}) {
  return (
    <div
      className={cn(
        "grid min-w-[760px] items-center gap-3 bg-[color-mix(in_srgb,var(--foreground)_4%,transparent)] px-6 py-3",
        gridClass,
      )}
    >
      {labels.map((label) => (
        <div
          key={label}
          className={cn(
            "text-[10px] font-semibold uppercase tracking-widest text-[var(--foreground-muted)]",
            label === "Actions" && "text-right",
          )}
        >
          {label}
        </div>
      ))}
    </div>
  );
}

function GridRow({
  gridClass,
  children,
}: {
  gridClass: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "grid min-w-[760px] items-center gap-3 border-b border-[var(--border)] px-6 py-4 transition-colors hover:bg-[color-mix(in_srgb,var(--foreground)_5%,transparent)]",
        gridClass,
      )}
    >
      {children}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="py-20 text-center">
      <Trophy className="mx-auto mb-4 size-12 text-amber-400" aria-hidden />
      <p className="text-lg font-semibold text-[var(--foreground)]">No rankings yet.</p>
      <p className="mx-auto mt-2 max-w-xs text-sm text-[var(--foreground-muted)]">
        Rankings appear after the first trades are placed on live markets.
      </p>
    </div>
  );
}

function YourRankRow({
  gridClass,
  colCount,
  rankLabel,
}: {
  gridClass: string;
  colCount: number;
  rankLabel: string;
}) {
  const dashCols = Math.max(0, colCount - 1);
  return (
    <div
      className={cn(
        "sticky bottom-0 grid min-w-[760px] items-center gap-3 border-t border-indigo-500/30 bg-[var(--background-secondary)] px-6 py-4",
        gridClass,
      )}
    >
      <span className="text-xs font-medium text-indigo-400">{rankLabel}</span>
      {Array.from({ length: dashCols }).map((_, i) => (
        <span key={i} className="text-sm text-[var(--foreground-muted)]">
          N/A
        </span>
      ))}
    </div>
  );
}

function BoardShell({
  tab,
  headers,
  note,
  children,
  empty,
  yourRank,
  footer,
}: {
  tab: LeaderboardTab;
  headers: string[];
  note?: string;
  children: ReactNode;
  empty: boolean;
  yourRank: ReactNode;
  footer: ReactNode;
}) {
  const gridClass = GRID[tab];
  return (
    <div className="space-y-3">
      {note ? <p className="text-xs text-[var(--foreground-muted)]">{note}</p> : null}
      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background-card)]">
        <div className="overflow-x-auto">
          <GridHeader labels={headers} gridClass={gridClass} />
          {empty ? <EmptyState /> : children}
        </div>
        {yourRank}
      </div>
      {!empty ? footer : null}
    </div>
  );
}

function ActionsCell({ address }: { address: string }) {
  return (
    <Link
      href={ROUTES.traderProfile(address)}
      className="text-xs font-semibold text-indigo-400 transition hover:text-indigo-300"
    >
      View →
    </Link>
  );
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
  const headers = [
    "Rank",
    "Wallet",
    "Accuracy %",
    "Markets Traded",
    "Profit (BNB)",
    "Creator Score",
    "Actions",
  ];
  return (
    <BoardShell
      tab="traders"
      headers={headers}
      empty={rows.length === 0}
      yourRank={yourRank}
      footer={footer}
    >
      {rows.map((row, index) => {
        const address = row.walletAddress ?? row.userId;
        return (
          <GridRow key={row.userId} gridClass={GRID.traders}>
            <RankCell rank={index + 1} />
            <WalletCell address={address} />
            <Cell>{row.winRatePct.toFixed(1)}%</Cell>
            <Cell>{row.marketsTraded}</Cell>
            <Cell className={parsePnl(row) >= 0 ? "text-green-400" : "text-red-400"}>
              {formatBnb(parsePnl(row))}
            </Cell>
            <Cell>{formatScore(row.creatorScore)}</Cell>
            <Cell align="right">
              <ActionsCell address={address} />
            </Cell>
          </GridRow>
        );
      })}
    </BoardShell>
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
  const headers = [
    "Rank",
    "Wallet",
    "Approved Markets",
    "Volume Generated",
    "Fees Earned",
    "Creator Score",
    "Actions",
  ];
  return (
    <BoardShell
      tab="creators"
      headers={headers}
      empty={rows.length === 0}
      yourRank={yourRank}
      footer={footer}
    >
      {rows.map((row, index) => (
        <GridRow key={row.creatorAddress} gridClass={GRID.creators}>
          <RankCell rank={index + 1} />
          <WalletCell address={row.creatorAddress} />
          <Cell>{row.marketCount}</Cell>
          <Cell>{compactUsd(row.totalVolumeUsd)}</Cell>
          <Cell className="text-green-400">{formatBnb(row.feesEarned)}</Cell>
          <Cell>{formatScore(row.creatorScore)}</Cell>
          <Cell align="right">
            <ActionsCell address={row.creatorAddress} />
          </Cell>
        </GridRow>
      ))}
    </BoardShell>
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
  const headers = [
    "Rank",
    "Wallet",
    "Accuracy %",
    "Total Trades",
    "Volume",
    "Profit",
    "Actions",
  ];
  return (
    <BoardShell
      tab="accuracy"
      headers={headers}
      note="Minimum qualifier: 5 trades"
      empty={rows.length === 0}
      yourRank={yourRank}
      footer={footer}
    >
      {rows.map((row, index) => {
        const address = row.walletAddress ?? row.userId;
        return (
          <GridRow key={row.userId} gridClass={GRID.accuracy}>
            <RankCell rank={index + 1} />
            <WalletCell address={address} />
            <Cell className="text-[var(--foreground)]">{row.winRatePct.toFixed(1)}%</Cell>
            <Cell>{row.tradeCount}</Cell>
            <Cell>{compactUsd(parseVol(row))}</Cell>
            <Cell className={parsePnl(row) >= 0 ? "text-green-400" : "text-red-400"}>
              {formatBnb(parsePnl(row))}
            </Cell>
            <Cell align="right">
              <ActionsCell address={address} />
            </Cell>
          </GridRow>
        );
      })}
    </BoardShell>
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
  const headers = [
    "Rank",
    "Wallet",
    "Total Profit (BNB)",
    "Best Single Trade",
    "Markets Traded",
    "Win Rate",
    "Actions",
  ];
  return (
    <BoardShell
      tab="profit"
      headers={headers}
      empty={rows.length === 0}
      yourRank={yourRank}
      footer={footer}
    >
      {rows.map((row, index) => {
        const address = row.walletAddress ?? row.userId;
        return (
          <GridRow key={row.userId} gridClass={GRID.profit}>
            <RankCell rank={index + 1} />
            <WalletCell address={address} />
            <Cell className={parsePnl(row) >= 0 ? "text-green-400" : "text-red-400"}>
              {formatBnb(parsePnl(row))}
            </Cell>
            <Cell>{compactUsd(row.bestTradeUsd)}</Cell>
            <Cell>{row.marketsTraded}</Cell>
            <Cell>{row.winRatePct.toFixed(1)}%</Cell>
            <Cell align="right">
              <ActionsCell address={address} />
            </Cell>
          </GridRow>
        );
      })}
    </BoardShell>
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
  const headers = [
    "Rank",
    "Wallet",
    "Total Volume",
    "Trades",
    "Avg Trade Size",
    "Active Since",
    "Actions",
  ];
  return (
    <BoardShell
      tab="volume"
      headers={headers}
      empty={rows.length === 0}
      yourRank={yourRank}
      footer={footer}
    >
      {rows.map((row, index) => {
        const address = row.walletAddress ?? row.userId;
        const avg =
          row.avgTradeSizeUsd ??
          (row.tradeCount > 0 ? parseVol(row) / row.tradeCount : 0);
        return (
          <GridRow key={row.userId} gridClass={GRID.volume}>
            <RankCell rank={index + 1} />
            <WalletCell address={address} />
            <Cell className="text-[var(--foreground)]">{compactUsd(parseVol(row))}</Cell>
            <Cell>{row.tradeCount}</Cell>
            <Cell>{compactUsd(avg)}</Cell>
            <Cell className="text-[var(--foreground-muted)]">{formatActiveSince(row.activeSince)}</Cell>
            <Cell align="right">
              <ActionsCell address={address} />
            </Cell>
          </GridRow>
        );
      })}
    </BoardShell>
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
    if (!address) return "Unranked";
    if (isCreators) {
      const viewer = creatorsQuery.data?.viewer;
      if (viewer?.rank != null) return `Your rank: #${viewer.rank}`;
      return "Unranked";
    }
    const viewer = tradersQuery.data?.viewer;
    if (tab === "accuracy" && viewer && !viewer.qualifies) {
      return "Unranked";
    }
    if (viewer?.rank != null) return `Your rank: #${viewer.rank}`;
    return "Unranked";
  }, [address, isCreators, creatorsQuery.data, tradersQuery.data, tab]);

  const viewerRank = isCreators
    ? creatorsQuery.data?.viewer?.rank
    : tradersQuery.data?.viewer?.rank;
  const inTop50 = viewerRank != null && viewerRank <= LIMIT;
  const showYourRank = Boolean(address) && !inTop50;

  const yourRank = showYourRank ? (
    <YourRankRow
      gridClass={GRID[tab]}
      colCount={7}
      rankLabel={yourRankLabel}
    />
  ) : null;

  const footer = (
    <p className="text-xs text-[var(--foreground-muted)]">
      Showing top {Math.min(LIMIT, isCreators ? creatorRows.length : traderRows.length)} of{" "}
      {total} total {isCreators ? "creators" : "traders"}
    </p>
  );

  const emptyBoard = (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background-card)]">
      <EmptyState />
      {showYourRank ? (
        <YourRankRow gridClass={GRID[tab]} colCount={7} rankLabel={yourRankLabel} />
      ) : address ? null : (
        <div className="border-t border-indigo-500/30 bg-[var(--background-secondary)] px-6 py-4">
          <button
            type="button"
            onClick={() => openConnectModal?.()}
            className="text-xs font-medium text-indigo-400 hover:text-indigo-300"
          >
            Connect wallet to see your rank
          </button>
        </div>
      )}
    </div>
  );

  return (
    <main className="mx-auto flex max-w-6xl flex-col pb-16 pt-10 md:pt-12">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--foreground)]">Leaderboard</h1>
          <p className="mt-1 text-sm text-[var(--foreground-muted)]">
            Top traders and creators ranked by performance on Orakly.
          </p>
        </div>
        <div className="flex gap-2">
          {PERIODS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setPeriod(item.id)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-xs transition-colors",
                period === item.id
                  ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-400"
                  : "border-[var(--border)] bg-[color-mix(in_srgb,var(--foreground)_5%,transparent)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      <div
        className="mb-6 flex w-full gap-1 overflow-x-auto rounded-xl bg-[color-mix(in_srgb,var(--foreground)_5%,transparent)] p-1"
        role="tablist"
        aria-label="Leaderboard category"
      >
        {TABS.map((item) => {
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(item.id)}
              className={cn(
                "flex-shrink-0 rounded-lg px-4 py-2 text-sm transition-all",
                active
                  ? "bg-[color-mix(in_srgb,var(--foreground)_10%,transparent)] font-medium text-[var(--foreground)]"
                  : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]",
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="h-72 animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--background-card)]" />
      ) : isCreators ? (
        creatorRows.length === 0 ? (
          emptyBoard
        ) : (
          <CreatorsTable rows={creatorRows} yourRank={yourRank} footer={footer} />
        )
      ) : traderRows.length === 0 ? (
        emptyBoard
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
