"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { Check, ExternalLink, Loader2, X } from "lucide-react";
import type { Address } from "viem";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useClaimWinnings } from "@/features/chain-trading";
import { bscTestnetTxUrl } from "@/features/chain-trading/lib/chain-contract-env";
import { CreatorRewardsPanel } from "@/features/creator/components/creator-rewards-panel";
import { TrendingMarketCard } from "@/widgets/trending-prediction-markets/components/trending-market-card";
import {
  selectWatchlistCount,
  useWatchlist,
  useWatchlistStore,
} from "@/features/watchlist";
import { cn } from "@/lib/utils";
import { useMarketsFeedQuery } from "@/shared/api/hooks";
import { useCreatorStatsQuery } from "@/shared/api/hooks/useCreatorStatsQuery";
import { fetchTraderProfileTrades } from "@/shared/api/fetchers/trader-profile";
import {
  fetchWalletPortfolio,
  type PortfolioPageDto,
  type PortfolioPositionRowDto,
} from "@/shared/api/fetchers/wallet-portfolio";
import { ROUTES } from "@/shared/constants/routes";

type PnlPeriod = "7d" | "30d" | "all";

const CLAIMED_KEY = "orakly:claimed-markets";

function formatBnb(n: number, digits = 2): string {
  if (!Number.isFinite(n)) return "0 BNB";
  const abs = Math.abs(n);
  const sign = n < 0 ? "−" : "";
  if (abs >= 1000) return `${sign}${(abs / 1000).toFixed(1)}k BNB`;
  return `${sign}${abs.toFixed(digits)} BNB`;
}

function formatOdds(price: number): string {
  const pct = Math.round(Math.max(0, Math.min(1, price)) * 100);
  return `${pct}¢`;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "N/A";
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return "N/A";
  }
}

function readClaimed(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(CLAIMED_KEY);
    const parsed = raw ? (JSON.parse(raw) as string[]) : [];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function writeClaimed(ids: Set<string>) {
  window.localStorage.setItem(CLAIMED_KEY, JSON.stringify([...ids]));
}

function Section({
  title,
  badge,
  trailing,
  children,
}: {
  title: string;
  badge?: ReactNode;
  trailing?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-[var(--foreground)]">
          {title}
          {badge}
        </h2>
        {trailing}
      </div>
      {children}
    </section>
  );
}

function CountBadge({ n }: { n: number }) {
  return (
    <span className="rounded-full bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)] px-2 py-0.5 text-[12px] font-semibold tabular-nums text-[var(--foreground-muted)] ring-1 ring-[var(--border)]">
      {n}
    </span>
  );
}

function SideBadge({ side }: { side: "YES" | "NO" }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold",
        side === "YES"
          ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/25"
          : "bg-rose-500/15 text-rose-300 ring-1 ring-rose-400/25",
      )}
    >
      {side}
    </span>
  );
}

function ConnectGate({ onConnect }: { onConnect: () => void }) {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-6xl items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] p-8 text-center shadow-xl">
        <h1 className="text-[22px] font-bold text-[var(--foreground)]">
          Connect your wallet to view your portfolio.
        </h1>
        <p className="mt-2 text-[13px] text-[var(--foreground-muted)]">
          Positions, PnL, claims, and creator earnings stay private until you connect.
        </p>
        <button
          type="button"
          onClick={onConnect}
          className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-500"
        >
          Connect Wallet
        </button>
      </div>
    </main>
  );
}

function OverviewCards({ overview }: { overview: PortfolioPageDto["overview"] }) {
  const pnlPositive = overview.totalPnlBnb >= 0;
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {[
        {
          label: "Portfolio Balance",
          value: formatBnb(overview.portfolioBalanceBnb),
          tone: "text-[var(--foreground)]",
        },
        {
          label: "Total PnL",
          value: `${formatBnb(overview.totalPnlBnb)} (${pnlPositive ? "+" : ""}${overview.totalPnlPct.toFixed(1)}%)`,
          tone: pnlPositive ? "text-emerald-300" : "text-rose-300",
        },
        {
          label: "Open Positions",
          value: String(overview.openPositionsCount),
          tone: "text-[var(--foreground)]",
        },
        {
          label: "Pending Settlement",
          value: String(overview.pendingSettlementCount),
          tone: "text-[var(--foreground)]",
        },
      ].map((card) => (
        <div
          key={card.label}
          className="rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] p-4"
        >
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">
            {card.label}
          </p>
          <p className={cn("mt-2 text-[18px] font-bold tabular-nums", card.tone)}>
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
}

function PnlChart({
  series,
}: {
  series: PortfolioPageDto["pnlSeries"];
}) {
  const [period, setPeriod] = useState<PnlPeriod>("30d");

  const data = useMemo(() => {
    const start =
      period === "all"
        ? null
        : Date.now() - (period === "7d" ? 7 : 30) * 24 * 60 * 60 * 1000;
    const filtered = series.filter((p) =>
      start ? new Date(p.at).getTime() >= start : true,
    );
    if (filtered.length === 0) {
      return [
        { label: "Start", pnl: 0 },
        { label: "Now", pnl: 0 },
      ];
    }
    return filtered.map((p) => ({
      label: formatDate(p.at),
      pnl: p.pnl,
      at: p.at,
    }));
  }, [series, period]);

  const positive = (data[data.length - 1]?.pnl ?? 0) >= 0;
  const stroke = positive ? "#34d399" : "#fb7185";
  const fill = positive ? "url(#pnlPos)" : "url(#pnlNeg)";

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">PnL Chart</h2>
        <div className="inline-flex rounded-lg border border-[var(--border)] p-0.5">
          {(
            [
              { id: "7d", label: "7D" },
              { id: "30d", label: "30D" },
              { id: "all", label: "All Time" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setPeriod(opt.id)}
              className={cn(
                "rounded-md px-2.5 py-1 text-[11px] font-semibold transition",
                period === opt.id
                  ? "bg-blue-600 text-white"
                  : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="pnlPos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34d399" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="pnlNeg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fb7185" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#fb7185" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: "var(--foreground-muted)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              minTickGap={40}
            />
            <YAxis
              tick={{ fill: "var(--foreground-muted)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={48}
            />
            <Tooltip
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(value) => [formatBnb(Number(value ?? 0)), "PnL"]}
            />
            <ReferenceLine y={0} stroke="var(--foreground-muted)" strokeDasharray="4 4" />
            <Area
              type="monotone"
              dataKey="pnl"
              stroke={stroke}
              fill={fill}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function OpenPositionsTable({ rows }: { rows: PortfolioPositionRowDto[] }) {
  if (rows.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-[var(--border)] px-4 py-8 text-center text-sm text-[var(--foreground-muted)]">
        No open positions
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-[var(--border)]">
      <table className="min-w-full text-left text-[13px]">
        <thead className="border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--foreground)_2%,transparent)] text-[11px] font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">
          <tr>
            <th className="px-4 py-3">Market</th>
            <th className="px-4 py-3">Side</th>
            <th className="px-4 py-3">Entry Price</th>
            <th className="px-4 py-3">Current Odds</th>
            <th className="px-4 py-3">Shares</th>
            <th className="px-4 py-3">Current Value</th>
            <th className="px-4 py-3">Est. Payout</th>
            <th className="px-4 py-3 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-[color-mix(in_srgb,var(--foreground)_5%,transparent)]">
              <td className="max-w-[240px] truncate px-4 py-3 font-medium text-[var(--foreground)]">
                {row.marketTitle}
              </td>
              <td className="px-4 py-3">
                <SideBadge side={row.side} />
              </td>
              <td className="px-4 py-3 font-mono tabular-nums text-[var(--foreground)]/80">
                {formatOdds(row.entryPrice)}
              </td>
              <td className="px-4 py-3 font-mono tabular-nums text-[var(--foreground)]/80">
                {formatOdds(row.currentOdds)}
              </td>
              <td className="px-4 py-3 font-mono tabular-nums text-[var(--foreground)]/80">
                {row.shares.toFixed(2)}
              </td>
              <td className="px-4 py-3 font-mono tabular-nums text-[var(--foreground)]/80">
                {formatBnb(row.currentValueBnb)}
              </td>
              <td className="px-4 py-3 font-mono tabular-nums text-[var(--foreground)]/80">
                {formatBnb(row.estPayoutBnb)}
              </td>
              <td className="px-4 py-3 text-right">
                <Link
                  href={ROUTES.market(row.marketSlug)}
                  className="text-[12px] font-semibold text-blue-300 hover:text-blue-200"
                >
                  View Market
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ClosedPositionsTable({ rows }: { rows: PortfolioPositionRowDto[] }) {
  if (rows.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-[var(--border)] px-4 py-8 text-center text-sm text-[var(--foreground-muted)]">
        No closed positions yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-[var(--border)]">
      <table className="min-w-full text-left text-[13px]">
        <thead className="border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--foreground)_2%,transparent)] text-[11px] font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">
          <tr>
            <th className="px-4 py-3">Market</th>
            <th className="px-4 py-3">Side</th>
            <th className="px-4 py-3">Result</th>
            <th className="px-4 py-3">Entry</th>
            <th className="px-4 py-3">Exit</th>
            <th className="px-4 py-3">PnL</th>
            <th className="px-4 py-3">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-[color-mix(in_srgb,var(--foreground)_5%,transparent)]">
              <td className="max-w-[240px] truncate px-4 py-3 font-medium text-[var(--foreground)]">
                {row.marketTitle}
              </td>
              <td className="px-4 py-3">
                <SideBadge side={row.side} />
              </td>
              <td className="px-4 py-3">
                {row.result === "WON" ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-300">
                    WON <Check className="size-3.5" aria-hidden />
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-semibold text-rose-300">
                    LOST <X className="size-3.5" aria-hidden />
                  </span>
                )}
              </td>
              <td className="px-4 py-3 font-mono tabular-nums text-[var(--foreground)]/80">
                {formatOdds(row.entryPrice)}
              </td>
              <td className="px-4 py-3 font-mono tabular-nums text-[var(--foreground)]/80">
                {row.exitPrice != null ? formatOdds(row.exitPrice) : "N/A"}
              </td>
              <td
                className={cn(
                  "px-4 py-3 font-mono tabular-nums",
                  (row.pnlBnb ?? 0) >= 0 ? "text-emerald-300" : "text-rose-300",
                )}
              >
                {row.pnlBnb != null ? formatBnb(row.pnlBnb) : "N/A"}
              </td>
              <td className="px-4 py-3 text-[var(--foreground-muted)]">{formatDate(row.closedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ClaimSection({
  rows,
  totalBnb,
}: {
  rows: PortfolioPositionRowDto[];
  totalBnb: number;
}) {
  const claim = useClaimWinnings();
  const [claimed, setClaimed] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    setClaimed(readClaimed());
  }, []);

  const pending = rows.filter((r) => !claimed.has(r.marketId));
  const claimableTotal = pending.reduce((sum, r) => sum + (r.claimableBnb ?? 0), 0);

  async function onClaim(row: PortfolioPositionRowDto) {
    if (!row.onChainAddress) return;
    try {
      await claim.mutateAsync(row.onChainAddress as Address);
      const next = new Set(claimed);
      next.add(row.marketId);
      setClaimed(next);
      writeClaimed(next);
    } catch {
      /* toast handled in hook */
    }
  }

  return (
    <Section
      title="Pending Settlement"
      badge={<CountBadge n={pending.length} />}
      trailing={
        pending.length > 0 ? (
          <span className="text-[13px] font-semibold text-emerald-300">
            {formatBnb(claimableTotal || totalBnb)} claimable
          </span>
        ) : null
      }
    >
      {rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[var(--border)] px-4 py-8 text-center text-sm text-[var(--foreground-muted)]">
          Nothing to claim right now
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {rows.map((row) => {
            const isClaimed = claimed.has(row.marketId);
            const busy = claim.isPending && claim.variables === row.onChainAddress;
            return (
              <div
                key={row.id}
                className="rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] p-4"
              >
                <p className="text-[14px] font-semibold leading-snug text-[var(--foreground)]">
                  {row.marketTitle}
                </p>
                <p className="mt-2 text-[13px] text-emerald-300">
                  You won {formatBnb(row.claimableBnb ?? 0)}
                </p>
                <button
                  type="button"
                  disabled={isClaimed || claim.isPending || !row.onChainAddress}
                  onClick={() => void onClaim(row)}
                  className={cn(
                    "mt-4 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition",
                    isClaimed
                      ? "cursor-default bg-emerald-500/20 text-emerald-200"
                      : "bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50",
                  )}
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {isClaimed ? (
                    <>
                      <Check className="size-4" aria-hidden />
                      Claimed
                    </>
                  ) : (
                    "Claim"
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </Section>
  );
}

function TradingHistory({ address }: { address: string }) {
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<
    Awaited<ReturnType<typeof fetchTraderProfileTrades>>["trades"]
  >([]);
  const [hasMore, setHasMore] = useState(false);

  const q = useQuery({
    queryKey: ["portfolio-trades", address, page] as const,
    queryFn: () => fetchTraderProfileTrades(address, { limit: 20, page }),
    staleTime: 20_000,
  });

  useEffect(() => {
    if (!q.data) return;
    setRows((prev) => (page === 1 ? q.data.trades : [...prev, ...q.data.trades]));
    setHasMore(Boolean(q.data.hasMore ?? q.data.nextCursor));
  }, [q.data, page]);

  useEffect(() => {
    setPage(1);
    setRows([]);
  }, [address]);

  return (
    <Section title="Trading History">
      {rows.length === 0 && q.isLoading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]" />
      ) : rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[var(--border)] px-4 py-8 text-center text-sm text-[var(--foreground-muted)]">
          No trades yet.
        </p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-[var(--border)]">
            <table className="min-w-full text-left text-[13px]">
              <thead className="border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--foreground)_2%,transparent)] text-[11px] font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Market</th>
                  <th className="px-4 py-3">Side</th>
                  <th className="px-4 py-3">Amount (BNB)</th>
                  <th className="px-4 py-3">Outcome</th>
                  <th className="px-4 py-3 text-right">Tx</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {rows.map((trade) => (
                  <tr key={trade.id} className="hover:bg-[color-mix(in_srgb,var(--foreground)_5%,transparent)]">
                    <td className="px-4 py-3 text-[var(--foreground-muted)]">{formatDate(trade.at)}</td>
                    <td className="max-w-[220px] truncate px-4 py-3 text-[var(--foreground)]">
                      <Link
                        href={ROUTES.market(trade.marketSlug)}
                        className="hover:text-blue-200"
                      >
                        {trade.marketTitle}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <SideBadge side={trade.side} />
                    </td>
                    <td className="px-4 py-3 font-mono tabular-nums text-[var(--foreground)]/80">
                      {formatBnb(trade.amountUsd)}
                    </td>
                    <td className="px-4 py-3 capitalize text-[var(--foreground)]/80">{trade.status}</td>
                    <td className="px-4 py-3 text-right">
                      {trade.txHash ? (
                        <a
                          href={bscTestnetTxUrl(trade.txHash)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex text-blue-300 hover:text-blue-200"
                          aria-label="View on BscScan"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      ) : (
                        <span className="text-[var(--foreground-muted)]">N/A</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {hasMore ? (
            <button
              type="button"
              disabled={q.isFetching}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[color-mix(in_srgb,var(--foreground)_5%,transparent)] disabled:opacity-50"
            >
              {q.isFetching ? "Loading…" : "Load more"}
            </button>
          ) : null}
        </>
      )}
    </Section>
  );
}

function CreatedMarketsSection({ address }: { address: string }) {
  const { data, isLoading } = useCreatorStatsQuery(address);
  if (isLoading || !data || data.markets.length === 0) return null;

  return (
    <Section title="My Created Markets" badge={<CountBadge n={data.markets.length} />}>
      <div className="overflow-x-auto rounded-2xl border border-[var(--border)]">
        <table className="min-w-full text-left text-[13px]">
          <thead className="border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--foreground)_2%,transparent)] text-[11px] font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">
            <tr>
              <th className="px-4 py-3">Market</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Volume</th>
              <th className="px-4 py-3">Fee %</th>
              <th className="px-4 py-3">Fees Earned</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {data.markets.map((m) => {
              const status = m.status.toUpperCase();
              const badge =
                status === "OPEN"
                  ? "bg-blue-500/15 text-blue-200"
                  : status === "RESOLVED"
                    ? "bg-[color-mix(in_srgb,var(--foreground)_12%,transparent)] text-[var(--foreground)]/80"
                    : "bg-amber-500/15 text-amber-200";
              return (
                <tr key={m.id} className="hover:bg-[color-mix(in_srgb,var(--foreground)_5%,transparent)]">
                  <td className="max-w-[280px] truncate px-4 py-3 font-medium text-[var(--foreground)]">
                    {m.question}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", badge)}>
                      {status === "OPEN"
                        ? "Open"
                        : status === "RESOLVED"
                          ? "Resolved"
                          : "Pending"}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono tabular-nums text-[var(--foreground)]/80">
                    {formatBnb(m.volume)}
                  </td>
                  <td className="px-4 py-3 font-mono tabular-nums text-[var(--foreground)]/80">
                    {m.creatorRewardPercent}%
                  </td>
                  <td className="px-4 py-3 font-mono tabular-nums text-emerald-300">
                    {formatBnb(m.feesEarned)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

function CreatorEarningsSection({ address }: { address: string }) {
  const { data } = useCreatorStatsQuery(address);
  if (!data || data.totalFeesEarned <= 0) return null;
  return (
    <Section title="Creator Earnings">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] p-4 [&_.rounded-xl]:border-[var(--border)] [&_.rounded-xl]:bg-[var(--background-secondary)] [&_th]:text-[var(--foreground-muted)] [&_td]:text-[var(--foreground)]">
        <CreatorRewardsPanel address={address} />
      </div>
    </Section>
  );
}

function WatchlistSection() {
  const { watchlist } = useWatchlist();
  const count = useWatchlistStore(selectWatchlistCount);
  const { data, isLoading } = useMarketsFeedQuery();

  const matched = useMemo(() => {
    if (!data) return [];
    const byId = new Map(data.map((m) => [m.id, m] as const));
    return watchlist.map((id) => byId.get(id)).filter(Boolean);
  }, [data, watchlist]);

  return (
    <Section title="Watchlist" badge={<CountBadge n={count} />}>
      <div id="watchlist" className="scroll-mt-24">
      {count === 0 ? (
        <p className="rounded-2xl border border-dashed border-[var(--border)] px-4 py-8 text-center text-sm text-[var(--foreground-muted)]">
          No markets saved yet. Star any market to add it here.
        </p>
      ) : isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-2xl bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {matched.map((market, index) =>
            market ? (
              <TrendingMarketCard
                key={market.id}
                market={market}
                index={index}
                variant="compact"
              />
            ) : null,
          )}
        </div>
      )}
      </div>
    </Section>
  );
}

function AnalyticsSection({ analytics }: { analytics: PortfolioPageDto["analytics"] }) {
  const pieData = [
    { name: "Wins", value: analytics.wins, color: "#34d399" },
    { name: "Losses", value: analytics.losses, color: "#fb7185" },
  ].filter((d) => d.value > 0);

  return (
    <Section title="Your Analytics">
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] p-4">
          <p className="text-[12px] font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">
            Win rate
          </p>
          <p className="mt-1 text-2xl font-bold text-[var(--foreground)]">
            {analytics.winRatePct.toFixed(1)}%
          </p>
          <div className="mt-2 h-[160px]">
            {pieData.length === 0 ? (
              <p className="flex h-full items-center justify-center text-sm text-[var(--foreground-muted)]">
                No resolved trades yet.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" innerRadius={40} outerRadius={60}>
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] p-4 lg:col-span-1">
          <p className="text-[12px] font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">
            Most traded narratives
          </p>
          <div className="mt-2 h-[180px]">
            {analytics.narrativeTrades.length === 0 ? (
              <p className="flex h-full items-center justify-center text-sm text-[var(--foreground-muted)]">
                No narrative activity yet.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.narrativeTrades}>
                  <XAxis
                    dataKey="narrative"
                    tick={{ fill: "var(--foreground-muted)", fontSize: 10 }}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis tick={{ fill: "var(--foreground-muted)", fontSize: 10 }} width={28} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4">
          <p className="text-[12px] font-semibold uppercase tracking-wider text-emerald-200/80">
            Best performing market
          </p>
          {analytics.bestTrade ? (
            <>
              <Link
                href={ROUTES.market(analytics.bestTrade.marketSlug)}
                className="mt-3 block text-[15px] font-semibold leading-snug text-[var(--foreground)] hover:text-[var(--foreground)]"
              >
                {analytics.bestTrade.marketTitle}
              </Link>
              <div className="mt-3 flex items-center gap-2">
                <SideBadge side={analytics.bestTrade.side} />
                <span className="text-lg font-bold tabular-nums text-emerald-300">
                  {formatBnb(analytics.bestTrade.pnlBnb)}
                </span>
              </div>
            </>
          ) : (
            <p className="mt-6 text-sm text-[var(--foreground-muted)]">No profitable trades yet.</p>
          )}
        </div>
      </div>
    </Section>
  );
}

function PortfolioConnected({ address }: { address: string }) {
  const portfolioQ = useQuery({
    queryKey: ["wallet-portfolio", address.toLowerCase()] as const,
    queryFn: () => fetchWalletPortfolio(address),
    staleTime: 20_000,
  });

  if (portfolioQ.isLoading) {
    return (
      <main className="mx-auto max-w-6xl space-y-6 px-4 pb-16 pt-10">
        <div className="h-10 w-48 animate-pulse rounded-lg bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]" />
          ))}
        </div>
        <div className="h-[240px] animate-pulse rounded-2xl bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]" />
      </main>
    );
  }

  if (portfolioQ.isError || !portfolioQ.data) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-16 text-center">
        <p className="text-sm text-rose-300">Unable to load portfolio. Try again.</p>
        <button
          type="button"
          onClick={() => void portfolioQ.refetch()}
          className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
        >
          Retry
        </button>
      </main>
    );
  }

  const data = portfolioQ.data;

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-10 px-4 pb-16 pt-10 md:pt-12">
      <header>
        <h1 className="text-[32px] font-bold leading-tight tracking-tight text-[var(--foreground)]">
          Portfolio
        </h1>
        <p className="mt-1 text-[14px] text-[var(--foreground-muted)]">
          Your positions, PnL, claims, and creator earnings.
        </p>
      </header>

      <OverviewCards overview={data.overview} />
      <PnlChart series={data.pnlSeries} />

      <Section
        title="Open Positions"
        badge={<CountBadge n={data.openPositions.length} />}
      >
        <OpenPositionsTable rows={data.openPositions} />
      </Section>

      <Section
        title="Closed Positions"
        badge={<CountBadge n={data.closedPositions.length} />}
      >
        <ClosedPositionsTable rows={data.closedPositions} />
      </Section>

      <ClaimSection
        rows={data.claimablePositions}
        totalBnb={data.overview.pendingSettlementBnb}
      />

      <TradingHistory address={address} />
      <CreatedMarketsSection address={address} />
      <CreatorEarningsSection address={address} />
      <WatchlistSection />
      <AnalyticsSection analytics={data.analytics} />
    </main>
  );
}

export function PortfolioPage() {
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();

  if (!isConnected || !address) {
    return <ConnectGate onConnect={() => openConnectModal?.()} />;
  }

  return <PortfolioConnected address={address} />;
}
