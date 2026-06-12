"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { motion } from "framer-motion";
import { ShieldCheck, Wallet } from "lucide-react";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAccount, useBalance } from "wagmi";
import { useWalletSessionQuery } from "@/features/wallet";
import {
  useLedgerQuery,
  useMarketsFeedQuery,
  usePortfolioQuery,
  useTradesInfiniteQuery,
  useWalletBalanceQuery,
} from "@/shared/api/hooks";
import { useAuthStore } from "@/state/stores/auth.store";
import { ROUTES } from "@/shared/constants/routes";
import { ConnectedWalletCard } from "./components/connected-wallet-card";
import { LinkedWalletsCard } from "./components/linked-wallets-card";
import { OnchainBalancesCard } from "./components/onchain-balances-card";
import { TransferDialog } from "./components/transfer-dialog";
import { WalletBalanceHero } from "./components/wallet-balance-hero";
import { WalletTransactions } from "./components/wallet-transactions";
import { buildWalletTransactions } from "./lib/build-transactions";
import { parseUsd } from "./lib/format";

type DialogState =
  | { open: false }
  | { open: true; kind: "DEPOSIT" | "WITHDRAW" };

export function WalletPage() {
  const actorId = useAuthStore((s) => s.tradingUserId ?? undefined);
  const { address, chain, isConnected } = useAccount();
  const { data: nativeBalance } = useBalance({
    address,
    query: { enabled: !!address },
  });
  const { data: session } = useWalletSessionQuery();
  const portfolioQ = usePortfolioQuery(actorId);
  const balanceQ = useWalletBalanceQuery(actorId);
  const ledgerQ = useLedgerQuery(actorId);
  const tradesQ = useTradesInfiniteQuery(actorId);
  const marketsQ = useMarketsFeedQuery();

  const [dialog, setDialog] = useState<DialogState>({ open: false });
  const [refreshing, setRefreshing] = useState(false);

  // ── Custodial balances (ledger-derived via backend)
  const availableUsd = balanceQ.data
    ? parseUsd(balanceQ.data.availableBalanceUsd)
    : portfolioQ.data?.wallet
      ? parseUsd(portfolioQ.data.wallet.availableBalanceUsd)
      : 0;
  const lockedUsd = balanceQ.data
    ? parseUsd(balanceQ.data.lockedBalanceUsd)
    : portfolioQ.data?.wallet
      ? parseUsd(portfolioQ.data.wallet.lockedBalanceUsd)
      : 0;
  const onChainSnapshot = portfolioQ.data?.onChain ?? null;

  // ── Marked-positions value (so the hero matches the portfolio dashboard).
  const positionsValueUsd = useMemo(() => {
    const positions = portfolioQ.data?.positions ?? [];
    let total = 0;
    for (const p of positions) {
      const qty = parseUsd(p.quantity);
      const px =
        p.side === "YES" ? parseUsd(p.market.yesPrice) : parseUsd(p.market.noPrice);
      total += qty * px;
    }
    return total;
  }, [portfolioQ.data?.positions]);

  // On-chain dollar value is a stub (would come from a price oracle); keep 0
  // when no native balance is loaded.
  const onChainUsd = 0;
  const totalUsd = availableUsd + lockedUsd + positionsValueUsd + onChainUsd;
  const nativeBalanceLabel = nativeBalance
    ? `${Number(nativeBalance.formatted).toFixed(4)} ${nativeBalance.symbol}`
    : null;

  // ── Build a unified, time-sorted tx list (trades + local movements).
  const flatTrades = useMemo(
    () => tradesQ.data?.pages.flatMap((p) => p.trades) ?? [],
    [tradesQ.data?.pages],
  );
  const marketTitleById = useMemo(() => {
    const m = new Map<string, string>();
    if (marketsQ.data) {
      for (const mk of marketsQ.data) {
        m.set(mk.id, mk.title);
        if (mk.backendMarketId) m.set(mk.backendMarketId, mk.title);
      }
    }
    if (portfolioQ.data?.positions) {
      for (const p of portfolioQ.data.positions) {
        m.set(p.marketId, p.market.title);
        m.set(p.market.id, p.market.title);
      }
    }
    return m;
  }, [marketsQ.data, portfolioQ.data?.positions]);

  const txRows = useMemo(
    () =>
      buildWalletTransactions({
        trades: flatTrades,
        ledger: ledgerQ.data,
        userId: actorId,
        marketTitleById,
        max: 60,
      }),
    [flatTrades, ledgerQ.data, actorId, marketTitleById],
  );

  // ── Refresh both the portfolio + on-chain RPC sync.
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.allSettled([
        fetch("/api/v1/wallet/onchain/sync", {
          method: "POST",
          headers: actorId ? { "x-trading-user-id": actorId } : undefined,
          body: JSON.stringify({}),
          credentials: "include",
        }).catch(() => null),
        portfolioQ.refetch(),
        balanceQ.refetch(),
        ledgerQ.refetch(),
      ]);
      toast.success("Balances refreshed");
    } finally {
      setRefreshing(false);
    }
  }, [actorId, portfolioQ, balanceQ, ledgerQ]);

  return (
    <main className="mx-auto flex max-w-6xl flex-col pb-s64 pt-s48 md:pt-s56">
      <motion.header
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-s40 flex flex-wrap items-end justify-between gap-r16 border-b border-white/[0.06] pb-r24"
      >
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-400/90">
            <Wallet className="h-3 w-3" />
            Treasury
          </p>
          <h1 className="mt-1.5 text-balance text-2xl font-semibold tracking-tight text-white sm:text-[1.65rem]">
            Wallet
          </h1>
          <p className="mt-1.5 max-w-xl text-[12.5px] text-zinc-500">
            Custodial cash, on-chain balances, deposits, withdrawals, and the full
            transaction tape — all on one screen.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-r16">
          <Link
            href={ROUTES.blockchainConnect}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.05] px-3 py-2 text-[12px] font-medium text-zinc-200 ring-1 ring-white/10 transition hover:bg-white/[0.1]"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Re-auth
          </Link>
          <ConnectButton
            chainStatus={isConnected ? "icon" : "none"}
            accountStatus={{ smallScreen: "avatar", largeScreen: "address" }}
            label="Connect wallet"
            showBalance={false}
          />
        </div>
      </motion.header>

      <div className="mb-r24">
      <WalletBalanceHero
        totalUsd={totalUsd}
        availableUsd={availableUsd}
        lockedUsd={lockedUsd}
        onChainUsd={positionsValueUsd}
        nativeBalanceLabel={nativeBalanceLabel}
        pnl24hPct={null}
        isConnected={isConnected}
        onDeposit={() => setDialog({ open: true, kind: "DEPOSIT" })}
        onWithdraw={() => setDialog({ open: true, kind: "WITHDRAW" })}
        onRefresh={() => void handleRefresh()}
        refreshing={refreshing || portfolioQ.isFetching || balanceQ.isFetching}
      />
      </div>

      <section className="mb-s40 grid gap-r24 lg:grid-cols-3">
        <ConnectedWalletCard authedAddress={session?.address ?? null} />
        <OnchainBalancesCard
          onChain={onChainSnapshot}
          nativeFormatted={
            nativeBalance
              ? `${Number(nativeBalance.formatted).toFixed(6)}`
              : null
          }
          nativeSymbol={nativeBalance?.symbol ?? chain?.nativeCurrency?.symbol ?? null}
        />
        <LinkedWalletsCard
          authedAddress={session?.address ?? null}
          explorerBase={chain?.blockExplorers?.default?.url ?? null}
        />
      </section>

      <WalletTransactions
        rows={txRows}
        isLoading={portfolioQ.isLoading || tradesQ.isLoading || ledgerQ.isLoading}
        isFetchingMore={tradesQ.isFetchingNextPage}
        hasNextPage={!!tradesQ.hasNextPage}
        onLoadMore={() => void tradesQ.fetchNextPage()}
      />

      <TransferDialog
        open={dialog.open}
        kind={dialog.open ? dialog.kind : "DEPOSIT"}
        onOpenChange={(next) => {
          if (!next) setDialog({ open: false });
        }}
        availableUsd={availableUsd}
        walletAddress={address ?? null}
        networkLabel={chain?.name ?? null}
      />
    </main>
  );
}
