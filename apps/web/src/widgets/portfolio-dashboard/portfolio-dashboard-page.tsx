"use client";

import { ArrowLeft, ArrowUpRight, Briefcase, RadioTower } from "lucide-react";
import { memo, useMemo } from "react";
import {
  useMarketsFeedQuery,
  usePortfolioQuery,
  useTradesInfiniteQuery,
  useTradingQueriesSync,
} from "@/shared/api/hooks";
import { useAuthStore } from "@/state/stores/auth.store";
import { Container, EmptyState, PageHeader, PrefetchLink } from "@/shared/ui";
import { ROUTES } from "@/shared/constants/routes";
import { PnlSummary } from "./components/pnl-summary";
import { PortfolioDashboardSkeleton } from "./components/portfolio-dashboard-skeleton";
import { PortfolioTerminalSummary } from "./components/portfolio-terminal-summary";
import { PositionsPanel } from "./components/positions-panel";
import { TradesHistory } from "./components/trades-history";
import {
  MarketExposurePanel,
  RoiEquityChart,
} from "./components/charts.lazy";
import {
  computeAnchoredEquitySeries,
  computeEquityUsd,
  computeGrossExposure,
  computeMarketExposure,
  computeUnrealizedPnlUsd,
  computeWinRateFromTrades,
  downsampleEquityPoints,
  parseUsd,
} from "./lib/portfolio-metrics";

function NoSessionPanel() {
  return (
    <EmptyState
      icon={Briefcase}
      tone="accent"
      title="Sign in to view positions"
      description="Connect your wallet to see equity, open positions, and trade history."
      primaryAction={
        <PrefetchLink
          href={ROUTES.wallet}
          className="inline-flex items-center gap-r16 rounded-[3px] bg-cyan-500/12 px-r24 py-r16 font-mono text-[11px] font-semibold text-cyan-100 transition hover:bg-cyan-500/18 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/35"
        >
          <ArrowUpRight className="h-3.5 w-3.5" /> Wallet
        </PrefetchLink>
      }
      secondaryAction={
        <PrefetchLink
          href={ROUTES.markets}
          className="inline-flex items-center gap-r16 rounded-[3px] bg-white/[0.05] px-r24 py-r16 font-mono text-[11px] font-semibold text-zinc-200 transition hover:bg-white/[0.08] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/15"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Markets
        </PrefetchLink>
      }
    />
  );
}

const PortfolioDashboardInner = memo(function PortfolioDashboardInner({
  actorId,
}: {
  actorId: string;
}) {
  const portfolioQ = usePortfolioQuery(actorId);

  useTradingQueriesSync(actorId, "me", {
    onChainSyncedAt: portfolioQ.data?.onChain?.syncedAt ?? null,
  });
  const tradesQ = useTradesInfiniteQuery(actorId);
  const marketsQ = useMarketsFeedQuery();

  const snapshot = portfolioQ.data;
  const flatTrades = useMemo(
    () => tradesQ.data?.pages.flatMap((p) => p.trades) ?? [],
    [tradesQ.data?.pages],
  );

  const equityUsd = useMemo(
    () => (snapshot ? computeEquityUsd(snapshot) : 0),
    [snapshot],
  );

  const unrealized = useMemo(
    () => (snapshot ? computeUnrealizedPnlUsd(snapshot) : 0),
    [snapshot],
  );

  const realized = useMemo(
    () => (snapshot ? parseUsd(snapshot.realizedPnlUsd) : 0),
    [snapshot],
  );

  const equitySeries = useMemo(() => {
    if (!snapshot) return [];
    const raw = computeAnchoredEquitySeries(flatTrades, actorId, equityUsd);
    return downsampleEquityPoints(raw, 96);
  }, [actorId, equityUsd, flatTrades, snapshot]);

  const winStats = useMemo(
    () => computeWinRateFromTrades(flatTrades, actorId),
    [flatTrades, actorId],
  );

  const grossExposure = useMemo(
    () => (snapshot ? computeGrossExposure(snapshot, equityUsd) : { pctOfEquity: 0, notionalUsd: 0 }),
    [snapshot, equityUsd],
  );

  const exposureSlices = useMemo(() => {
    if (!snapshot) return [];
    return computeMarketExposure(snapshot, equityUsd, marketsQ.data);
  }, [snapshot, equityUsd, marketsQ.data]);

  const walletAvailable = snapshot?.wallet ? parseUsd(snapshot.wallet.availableBalanceUsd) : 0;
  const walletLocked = snapshot?.wallet ? parseUsd(snapshot.wallet.lockedBalanceUsd) : 0;

  const positions = snapshot?.positions ?? [];

  if (portfolioQ.isLoading && !snapshot) {
    return <PortfolioDashboardSkeleton />;
  }

  return (
    <main className="text-[var(--hub-fg,#e8f0ff)]">
      <Container width="2xl" className="pb-s48 pt-s40 lg:pb-s64 lg:pt-s56">
        <PageHeader
          title="Portfolio"
          description="Equity, exposure, and fills for your session"
          meta={
            <span className="inline-flex items-center gap-r8 rounded-[3px] bg-emerald-500/[0.07] px-r8 py-r4 font-mono text-[9px] font-semibold uppercase tracking-wide text-emerald-400/95 ring-1 ring-emerald-500/18">
              <RadioTower className="h-2 w-2 shrink-0" />
              Live
            </span>
          }
          actions={
            <PrefetchLink
              href={ROUTES.markets}
              className="inline-flex items-center gap-r16 rounded-[3px] border border-white/[0.08] bg-white/[0.03] px-r16 py-r8 font-mono text-[9.5px] font-medium uppercase tracking-[0.06em] text-zinc-400 transition hover:border-white/[0.12] hover:bg-white/[0.05] hover:text-zinc-200 active:scale-[0.98]"
            >
              <ArrowLeft className="h-3.5 w-3.5 opacity-80" />
              Markets
            </PrefetchLink>
          }
        />

        <div className="mt-r24 flex flex-col gap-r24 lg:mt-s40 lg:gap-r24">
          {/* Primary book (left) + risk rail (right) — not a symmetric “dashboard grid”. */}
          <div className="flex flex-col gap-r24 lg:grid lg:max-w-none lg:grid-cols-[minmax(0,1fr)_minmax(252px,288px)] lg:items-start lg:gap-r24 xl:grid-cols-[minmax(0,1fr)_300px]">
            <div className="flex min-w-0 flex-col gap-r24">
              <PortfolioTerminalSummary
                equityUsd={equityUsd}
                realizedUsd={realized}
                unrealizedUsd={unrealized}
                winRatePct={winStats.winRatePct}
                exposurePctOfEquity={grossExposure.pctOfEquity}
                exposureNotionalUsd={grossExposure.notionalUsd}
                positionCount={positions.length}
                availableUsd={walletAvailable}
                lockedUsd={walletLocked}
              />

              {snapshot?.onChain && snapshot.onChain.balances.length > 0 ? (
                <div className="surface-terminal-solid rounded-md px-r16 py-r16 sm:px-r24">
                  <div className="flex flex-wrap items-center justify-between gap-r16">
                    <p className="label-terminal">On-chain · {snapshot.onChain.chainId}</p>
                    {snapshot.onChain.syncedAt ? (
                      <p className="font-mono text-[9px] tabular-nums text-zinc-600">
                        {new Date(snapshot.onChain.syncedAt).toLocaleTimeString()}
                      </p>
                    ) : null}
                  </div>
                  <div className="mt-r16 flex flex-wrap gap-r8">
                    {snapshot.onChain.balances.map((b) => (
                      <div
                        key={`${b.tokenAddress}-${b.symbol}`}
                        className="rounded-[3px] bg-white/[0.035] px-r16 py-r8 ring-1 ring-white/[0.06]"
                      >
                        <p className="label-terminal text-[7.5px]">{b.symbol}</p>
                        <p className="mt-r4 font-mono text-[11px] tabular-nums text-zinc-200">{b.formattedBalance}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <PositionsPanel positions={positions} feedRevision={portfolioQ.dataUpdatedAt} />
            </div>

            <aside className="flex min-w-0 flex-col gap-r16 lg:sticky lg:top-[calc(var(--app-topbar-h)+10px)] lg:self-start">
              <MarketExposurePanel slices={exposureSlices} equityUsd={equityUsd} chartHeight={124} />
              <div className="grid gap-r16 sm:grid-cols-2 lg:grid-cols-1">
                <PnlSummary realizedUsd={realized} unrealizedUsd={unrealized} dense />
                <RoiEquityChart data={equitySeries} chartHeight={148} />
              </div>
            </aside>
          </div>

          <section className="mt-s48 border-t border-white/[0.06] pt-r24 lg:pt-s40">
            <p className="label-terminal mb-r16">Execution log</p>
            <TradesHistory
              trades={flatTrades}
              hasNextPage={!!tradesQ.hasNextPage}
              isFetchingNextPage={tradesQ.isFetchingNextPage}
              onLoadMore={() => void tradesQ.fetchNextPage()}
            />
          </section>
        </div>
      </Container>
    </main>
  );
});

export function PortfolioDashboardPage() {
  const actorId = useAuthStore((s) => s.tradingUserId ?? undefined);

  if (!actorId) {
    return (
      <main className="flex justify-center py-s48 sm:py-s56">
        <div className="w-full max-w-md">
          <NoSessionPanel />
        </div>
      </main>
    );
  }

  return <PortfolioDashboardInner actorId={actorId} />;
}
