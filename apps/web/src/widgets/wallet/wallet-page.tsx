"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { motion } from "framer-motion";
import { ExternalLink, ShieldCheck, Wallet } from "lucide-react";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAccount, useBalance } from "wagmi";
import {
  useChainCollateralBalance,
  useChainWalletPositions,
} from "@/features/chain-trading";
import { useWalletSessionQuery } from "@/features/wallet";
import { getBscTestnetUsdcFaucetUrl } from "@/lib/chain-public-env";
import { useMarketsFeedQuery } from "@/shared/api/hooks";
import { ROUTES } from "@/shared/constants/routes";
import { ChainPositionsCard } from "./components/chain-positions-card";
import { ConnectedWalletCard } from "./components/connected-wallet-card";
import { LinkedWalletsCard } from "./components/linked-wallets-card";
import { OnchainBalancesCard } from "./components/onchain-balances-card";
import { WalletBalanceHero } from "./components/wallet-balance-hero";

export function WalletPage() {
  const { address, chain, isConnected } = useAccount();
  const { data: nativeBalance } = useBalance({
    address,
    query: { enabled: !!address },
  });
  const { data: session } = useWalletSessionQuery();
  const marketsQ = useMarketsFeedQuery();
  const collateralQ = useChainCollateralBalance(address);

  const [refreshing, setRefreshing] = useState(false);

  const deployedMarkets = useMemo(
    () =>
      (marketsQ.data ?? [])
        .filter((m) => m.onChainAddress)
        .map((m) => ({
          id: m.id,
          slug: m.slug,
          title: m.title,
          onChainAddress: m.onChainAddress!,
          midYes: m.probability,
        })),
    [marketsQ.data],
  );

  const positionsQ = useChainWalletPositions(address, deployedMarkets);

  const collateralUsd = collateralQ.data?.formatted ?? 0;
  const positionsValueUsd = useMemo(
    () => (positionsQ.data ?? []).reduce((sum, p) => sum + p.valueUsd, 0),
    [positionsQ.data],
  );
  const totalUsd = collateralUsd + positionsValueUsd;

  const nativeBalanceLabel = nativeBalance
    ? `${Number(nativeBalance.formatted).toFixed(4)} ${nativeBalance.symbol}`
    : null;

  const collateralSnapshot = useMemo(() => {
    if (!collateralQ.data || !address) return null;
    return {
      chainId: 97,
      walletAddress: address,
      syncedAt: new Date().toISOString(),
      balances: [
        {
          tokenAddress: "",
          symbol: collateralQ.data.symbol,
          formattedBalance: collateralQ.data.formatted.toFixed(
            Math.min(collateralQ.data.decimals, 6),
          ),
          rawBalance: collateralQ.data.raw.toString(),
          decimals: collateralQ.data.decimals,
          isNative: false,
        },
      ],
    };
  }, [address, collateralQ.data]);

  const faucetUrl = getBscTestnetUsdcFaucetUrl();

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.allSettled([
        collateralQ.refetch(),
        positionsQ.refetch(),
        marketsQ.refetch(),
      ]);
      toast.success("On-chain balances refreshed");
    } finally {
      setRefreshing(false);
    }
  }, [collateralQ, positionsQ, marketsQ]);

  return (
    <main className="mx-auto flex max-w-6xl flex-col pb-s64 pt-s48 md:pt-s56">
      <motion.header
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-s40 flex flex-wrap items-end justify-between gap-r16 border-b border-[var(--border)] pb-r24"
      >
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-400/90">
            <Wallet className="h-3 w-3" />
            On-chain treasury
          </p>
          <h1 className="mt-1.5 text-balance text-2xl font-semibold tracking-tight text-[var(--foreground)] sm:text-[1.65rem]">
            Wallet
          </h1>
          <p className="mt-1.5 max-w-xl text-[12.5px] text-[var(--foreground-muted)]">
            Connect MetaMask on BSC testnet, fund collateral, and trade deployed
            markets — balances and positions read directly from chain.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-r16">
          <Link
            href={ROUTES.blockchainConnect}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[color-mix(in_srgb,var(--foreground)_5%,transparent)] px-3 py-2 text-[12px] font-medium text-[var(--foreground)] ring-1 ring-[var(--border)] transition hover:bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Sign in
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
          collateralUsd={collateralUsd}
          positionsUsd={positionsValueUsd}
          nativeBalanceLabel={nativeBalanceLabel}
          collateralSymbol={collateralQ.data?.symbol ?? "USDC"}
          isConnected={isConnected}
          faucetUrl={faucetUrl}
          onRefresh={() => void handleRefresh()}
          refreshing={
            refreshing || collateralQ.isFetching || positionsQ.isFetching
          }
        />
      </div>

      {!isConnected ? (
        <div className="mb-s40 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-[12.5px] text-amber-100">
          Connect MetaMask on <strong>BNB Smart Chain</strong> to see
          your collateral balance and open positions.
        </div>
      ) : null}

      <section className="mb-s40 grid gap-r24 lg:grid-cols-3">
        <ConnectedWalletCard authedAddress={session?.address ?? null} />
        <OnchainBalancesCard
          onChain={collateralSnapshot}
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

      <section className="mb-s40">
        <ChainPositionsCard
          positions={positionsQ.data ?? []}
          isLoading={positionsQ.isLoading && isConnected}
        />
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--foreground)_3%,transparent)] px-4 py-3 text-[12px] text-[var(--foreground-muted)]">
        <p className="font-medium text-[var(--foreground)]/80">Need test collateral?</p>
        <p className="mt-1 leading-relaxed">
          Obtain test USDC from the faucet, then approve the market contract when
          you place your first trade. Gas is paid in tBNB.
        </p>
        <a
          href={faucetUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex items-center gap-1.5 font-medium text-cyan-300 hover:text-cyan-200"
        >
          Get test USDC
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </section>
    </main>
  );
}
