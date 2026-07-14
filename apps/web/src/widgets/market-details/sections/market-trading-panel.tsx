"use client";

import { useConnectModal } from "@rainbow-me/rainbowkit";
import { parseUnits, type Address } from "viem";
import { useAccount } from "wagmi";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  collateralDecimals,
  useChainCollateralBalance,
  useChainMarketExecution,
  useChainWalletPositions,
  useClaimWinnings,
} from "@/features/chain-trading";
import { cn } from "@/lib/utils";
import type { MarketDetailDto } from "@/shared/contracts/market-detail";

type Tab = "buy" | "sell";

export function MarketTradingPanel({ market }: { market: MarketDetailDto }) {
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const [tab, setTab] = useState<Tab>("buy");
  const [outcome, setOutcome] = useState<"YES" | "NO">("YES");
  const [amount, setAmount] = useState("");
  const [sellShares, setSellShares] = useState("");

  const deployed = Boolean(market.onChainAddress?.trim());
  const marketAddress = (market.onChainAddress?.trim() || "") as Address;
  const yesPrice = Math.max(0.01, Math.min(0.99, market.probability || 0.5));
  const noPrice = 1 - yesPrice;
  const currentPrice = outcome === "YES" ? yesPrice : noPrice;
  const creatorFee = market.creatorRewardPercent > 0 ? market.creatorRewardPercent : 0;
  const platformFee = 3;

  const collateralQ = useChainCollateralBalance(address);
  const positionsQ = useChainWalletPositions(
    address,
    deployed
      ? [
          {
            id: market.backendMarketId,
            slug: market.slug,
            title: market.title,
            onChainAddress: market.onChainAddress!,
            midYes: yesPrice,
          },
        ]
      : undefined,
  );
  const position = positionsQ.data?.[0];
  const yesHeld = position?.yesShares ?? 0;
  const noHeld = position?.noShares ?? 0;

  const exec = useChainMarketExecution();
  const claim = useClaimWinnings();

  const amountNum = Number(amount);
  const sellNum = Number(sellShares);
  const estShares =
    Number.isFinite(amountNum) && amountNum > 0 ? amountNum / currentPrice : 0;
  const totalCost = Number.isFinite(amountNum) && amountNum > 0 ? amountNum : 0;
  const sellReceive =
    Number.isFinite(sellNum) && sellNum > 0 ? sellNum * currentPrice : 0;

  const resolved = (market.rawStatus || market.status).toUpperCase() === "RESOLVED";
  const winnerYes =
    market.resolvedOutcome === "YES" ||
    market.resolvedOutcome === "FOR" ||
    String(market.resolvedOutcome || "").toUpperCase() === "YES";
  const winnerNo =
    market.resolvedOutcome === "NO" ||
    market.resolvedOutcome === "AGAINST" ||
    String(market.resolvedOutcome || "").toUpperCase() === "NO";

  const userWon = useMemo(() => {
    if (!resolved) return false;
    if (winnerYes && yesHeld > 0) return true;
    if (winnerNo && noHeld > 0) return true;
    return false;
  }, [resolved, winnerYes, winnerNo, yesHeld, noHeld]);

  const userLost = useMemo(() => {
    if (!resolved) return false;
    if (yesHeld <= 0 && noHeld <= 0) return false;
    return !userWon;
  }, [resolved, yesHeld, noHeld, userWon]);

  if (resolved) {
    return (
      <section className="rounded-2xl border border-white/[0.08] p-6 text-center">
        <p
          className={cn(
            "text-[28px] font-bold",
            winnerYes ? "text-emerald-400" : winnerNo ? "text-rose-400" : "text-zinc-200",
          )}
        >
          {winnerYes ? "✅ YES WON" : winnerNo ? "❌ NO WON" : "Market Resolved"}
        </p>
        {userWon && deployed ? (
          <button
            type="button"
            disabled={claim.isPending}
            onClick={() => claim.mutate(marketAddress)}
            className="mt-4 rounded-xl bg-emerald-600 px-6 py-3 text-[15px] font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
          >
            {claim.isPending ? "Claiming…" : "Claim Winnings"}
          </button>
        ) : null}
        {userLost ? (
          <p className="mt-4 text-[15px] text-zinc-400">Better luck next time</p>
        ) : null}
        {!userWon && !userLost ? (
          <p className="mt-4 text-[13px] text-zinc-500">
            No positions to claim on this market.
          </p>
        ) : null}
      </section>
    );
  }

  async function onTrade() {
    if (!isConnected) {
      openConnectModal?.();
      return;
    }
    if (!deployed) return;

    try {
      const decimals = collateralDecimals();
      if (tab === "buy") {
        if (!Number.isFinite(amountNum) || amountNum <= 0) {
          toast.error("Enter an amount to buy");
          return;
        }
        await exec.mutateAsync({
          marketAddress,
          outcome,
          direction: "BUY",
          amountWei: parseUnits(amountNum.toFixed(decimals), decimals),
        });
        toast.success("Trade submitted");
        setAmount("");
      } else {
        if (!Number.isFinite(sellNum) || sellNum <= 0) {
          toast.error("Enter shares to sell");
          return;
        }
        await exec.mutateAsync({
          marketAddress,
          outcome,
          direction: "SELL",
          amountWei: parseUnits(sellNum.toFixed(decimals), decimals),
        });
        toast.success("Sell submitted");
        setSellShares("");
      }
      void collateralQ.refetch();
      void positionsQ.refetch();
    } catch {
      /* toast handled in mutation */
    }
  }

  const ctaLabel = !isConnected
    ? "Connect Wallet"
    : !deployed
      ? "Not Yet Deployed"
      : tab === "buy"
        ? "Trade"
        : "Sell";

  return (
    <section className="rounded-2xl border border-white/[0.08] bg-zinc-950/30 p-5 sm:p-6">
      <div className="mb-4 flex gap-2">
        {(["buy", "sell"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "rounded-xl px-4 py-2 text-[14px] font-semibold capitalize transition",
              tab === t
                ? "bg-blue-600 text-white"
                : "text-zinc-400 ring-1 ring-white/10 hover:bg-white/[0.05]",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "buy" ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <OutcomeButton
              label="YES ↑"
              selected={outcome === "YES"}
              tone="yes"
              onClick={() => setOutcome("YES")}
            />
            <OutcomeButton
              label="NO ↓"
              selected={outcome === "NO"}
              tone="no"
              onClick={() => setOutcome("NO")}
            />
          </div>

          <label className="block">
            <span className="text-[12px] font-medium text-zinc-500">Amount (BNB)</span>
            <div className="mt-1 flex gap-2">
              <input
                type="number"
                min={0}
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0"
                className="w-full rounded-xl border border-white/10 bg-zinc-900/80 px-3 py-3 text-[15px] text-zinc-100 outline-none focus:border-blue-500/50"
              />
              <button
                type="button"
                onClick={() => {
                  const bal = collateralQ.data?.formatted ?? 0;
                  setAmount(bal > 0 ? String(bal) : "0");
                }}
                className="shrink-0 rounded-xl px-3 text-[13px] font-semibold text-blue-300 ring-1 ring-white/10 hover:bg-white/[0.06]"
              >
                Max
              </button>
            </div>
          </label>

          <p className="text-[13px] text-zinc-400">
            You receive approximately{" "}
            <span className="font-semibold text-zinc-100">{estShares.toFixed(4)}</span> shares
          </p>
          <p className="text-[13px] text-zinc-500">
            Platform fee: {platformFee}%
            {creatorFee > 0 ? (
              <>
                {" "}
                · Creator fee: {creatorFee}%
              </>
            ) : null}
          </p>
          <p className="text-[14px] font-semibold text-zinc-100">
            Total cost: {totalCost > 0 ? totalCost.toFixed(4) : "—"} BNB
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl bg-white/[0.04] p-3 text-[13px] text-zinc-300 ring-1 ring-white/[0.06]">
            <p>
              You hold{" "}
              <span className="font-semibold text-emerald-300">{yesHeld.toFixed(4)} YES</span>{" "}
              shares
            </p>
            <p className="mt-1">
              and{" "}
              <span className="font-semibold text-rose-300">{noHeld.toFixed(4)} NO</span> shares
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <OutcomeButton
              label="Sell YES"
              selected={outcome === "YES"}
              tone="yes"
              onClick={() => setOutcome("YES")}
            />
            <OutcomeButton
              label="Sell NO"
              selected={outcome === "NO"}
              tone="no"
              onClick={() => setOutcome("NO")}
            />
          </div>

          <label className="block">
            <span className="text-[12px] font-medium text-zinc-500">Shares to sell</span>
            <div className="mt-1 flex gap-2">
              <input
                type="number"
                min={0}
                step="any"
                value={sellShares}
                onChange={(e) => setSellShares(e.target.value)}
                placeholder="0.0"
                className="w-full rounded-xl border border-white/10 bg-zinc-900/80 px-3 py-3 text-[15px] text-zinc-100 outline-none focus:border-blue-500/50"
              />
              <button
                type="button"
                onClick={() =>
                  setSellShares(String(outcome === "YES" ? yesHeld : noHeld))
                }
                className="shrink-0 rounded-xl px-3 text-[13px] font-semibold text-blue-300 ring-1 ring-white/10 hover:bg-white/[0.06]"
              >
                Max
              </button>
            </div>
          </label>

          <p className="text-[14px] font-semibold text-zinc-100">
            You receive: {sellReceive > 0 ? sellReceive.toFixed(4) : "—"} BNB
          </p>
        </div>
      )}

      <button
        type="button"
        disabled={
          (!isConnected && !openConnectModal) ||
          (isConnected && !deployed) ||
          exec.isPending
        }
        onClick={() => void onTrade()}
        className={cn(
          "mt-5 w-full rounded-xl py-3.5 text-[16px] font-bold transition",
          !deployed && isConnected
            ? "cursor-not-allowed bg-zinc-700 text-zinc-400"
            : "bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-60",
        )}
      >
        {exec.isPending ? "Confirm in wallet…" : ctaLabel}
      </button>
    </section>
  );
}

function OutcomeButton({
  label,
  selected,
  tone,
  onClick,
}: {
  label: string;
  selected: boolean;
  tone: "yes" | "no";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative rounded-xl px-4 py-4 text-[16px] font-bold transition",
        tone === "yes"
          ? "bg-emerald-600/20 text-emerald-300"
          : "bg-rose-600/20 text-rose-300",
        selected
          ? tone === "yes"
            ? "border-4 border-emerald-400"
            : "border-4 border-rose-400"
          : "border border-transparent ring-1 ring-white/10",
      )}
    >
      {selected ? <span className="absolute right-2 top-1 text-[14px]">✓</span> : null}
      {label}
    </button>
  );
}
