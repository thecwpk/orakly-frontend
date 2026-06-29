"use client";

import { Dialog as DialogPrimitive } from "radix-ui";
import { AnimatePresence, motion } from "framer-motion";
import { Clock, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useAccount } from "wagmi";
import { useChainMarketExecution } from "@/features/chain-trading/hooks/use-chain-market-execution";
import { collateralDecimals } from "@/features/chain-trading/lib/chain-contract-env";
import { parseUnits, type Address } from "viem";
import { useTradeModalStore } from "../store/use-trade-modal-store";
import {
  TradeComposePanel,
  type TradeComposeResult,
  type TradeDraft,
} from "./trade-compose-panel";
import { TradeConfirmPanel } from "./trade-confirm-panel";
import { TradeResultPanel } from "./trade-result-panel";
import { cn } from "@/lib/utils";

type Phase = "compose" | "confirm" | "result";

function timeUntilClose(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  if (Number.isNaN(ms) || ms <= 0) return "closed";
  const m = Math.floor(ms / 60_000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (m < 60) return `${m}m`;
  if (h < 24) return `${h}h`;
  return `${d}d`;
}

export function TradeModal() {
  const { address, isConnected } = useAccount();
  const { isOpen, market, initialOutcome, setOpen, close } = useTradeModalStore();
  const canExecuteTrade = isConnected && Boolean(address) && Boolean(market?.onChainAddress);

  // ── Phase + draft persisted across phases (compose → confirm → result)
  const [phase, setPhase] = useState<Phase>("compose");
  const [composed, setComposed] = useState<TradeComposeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [chainTxHash, setChainTxHash] = useState<string | null>(null);
  // Snapshot mid YES at compose-time so the confirm slippage banner is meaningful.
  const [composedMid, setComposedMid] = useState<number>(0.5);

  // Reset whenever the modal is reopened with a (possibly new) market.
  useEffect(() => {
    if (isOpen) {
      setPhase("compose");
      setComposed(null);
      setChainTxHash(null);
      setError(null);
      if (market) setComposedMid(market.midYes);
    }
  }, [isOpen, market]);

  const chainExec = useChainMarketExecution();

  const handleConfirm = useCallback(
    (draft: TradeDraft) => {
      if (!market?.onChainAddress) {
        setError(
          "This market is not deployed on-chain. Only on-chain markets can be traded via MetaMask.",
        );
        setPhase("result");
        return;
      }
      if (!composed) return;

      setError(null);
      setChainTxHash(null);

      const decimals = collateralDecimals();
      const amountWei =
        draft.direction === "BUY"
          ? parseUnits(draft.usd.toFixed(decimals), decimals)
          : parseUnits(draft.shares.toFixed(6), 18);

      chainExec.mutate(
        {
          marketAddress: market.onChainAddress as Address,
          outcome: draft.outcome,
          direction: draft.direction,
          amountWei,
        },
        {
          onSuccess: (res) => {
            setChainTxHash(res.txHash);
            setPhase("result");
            toast.success("On-chain trade confirmed", {
              description: `${draft.direction} ${draft.outcome} — tx ${res.txHash.slice(0, 10)}…`,
            });
          },
          onError: (e) => {
            setError(e instanceof Error ? e.message : "Unknown error");
            setPhase("result");
          },
        },
      );
    },
    [chainExec, composed, market?.onChainAddress],
  );

  if (!market) return null;

  const isMobile = false; // styles handle responsive — flag retained for future swipe-to-dismiss

  // ── Header copy varies per phase
  const headerTitle =
    phase === "compose"
      ? "Trade market"
      : phase === "confirm"
        ? "Review trade"
        : error
          ? "Trade failed"
          : "Trade executed";

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={setOpen}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-[#03030780]/85 supports-[backdrop-filter]:backdrop-blur-md",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
          )}
        />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className={cn(
            "fixed z-50 flex max-h-[92dvh] flex-col overflow-hidden",
            "relative",
            // mobile: bottom sheet — full width, safe-area-aware bottom padding
            "inset-x-0 bottom-0 rounded-t-2xl pb-[env(safe-area-inset-bottom)]",
            // desktop: centered modal
            "sm:inset-auto sm:left-1/2 sm:top-1/2 sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:pb-0",
            // ultra-wide: slightly wider modal so the preview rows breathe
            "2xl:max-w-lg",
            // surface
            "bg-[#0a0a12] text-zinc-100 ring-1 ring-white/[0.08] shadow-[0_20px_80px_-20px_rgba(0,0,0,0.6)]",
            // animations
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
            // mobile slide
            "data-[state=open]:slide-in-from-bottom-4 data-[state=closed]:slide-out-to-bottom-4",
            // desktop zoom
            "sm:data-[state=open]:zoom-in-95 sm:data-[state=closed]:zoom-out-95",
            "sm:data-[state=open]:slide-in-from-bottom-0 sm:data-[state=closed]:slide-out-to-bottom-0",
            "outline-none",
          )}
          onInteractOutside={(e) => {
            if (chainExec.isPending) e.preventDefault();
          }}
          onEscapeKeyDown={(e) => {
            if (chainExec.isPending) e.preventDefault();
          }}
        >
          {/* Drag handle (mobile) */}
          <div
            aria-hidden
            className="mx-auto mt-2 h-1 w-10 rounded-full bg-white/10 sm:hidden"
          />

          {/* Header */}
          <div className="relative flex items-start justify-between gap-3 border-b border-white/[0.06] px-5 pb-3 pt-4">
            <div className="min-w-0">
              <DialogPrimitive.Title asChild>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
                  {headerTitle}
                </p>
              </DialogPrimitive.Title>
              <p className="mt-1 line-clamp-2 text-[14px] font-medium leading-snug text-white">
                {market.title}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10.5px] text-zinc-500">
                <span className="rounded-md bg-white/[0.04] px-1.5 py-0.5 uppercase tracking-wide ring-1 ring-white/[0.06]">
                  {market.category}
                </span>
                <span className="inline-flex items-center gap-1 rounded-md bg-white/[0.03] px-1.5 py-0.5 font-mono ring-1 ring-white/[0.05]">
                  <Clock className="h-2.5 w-2.5" />
                  {timeUntilClose(market.closesAt)}
                </span>
              </div>
            </div>

            <DialogPrimitive.Close
              disabled={chainExec.isPending}
              aria-label="Close trade modal"
              className={cn(
                "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white/[0.04] text-zinc-300 ring-1 ring-white/[0.08] transition active:scale-95 sm:h-8 sm:w-8",
                "hover:bg-white/[0.08] hover:text-white",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/30",
                "disabled:cursor-not-allowed disabled:opacity-40",
              )}
            >
              <X className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
            </DialogPrimitive.Close>

            {/* Phase indicator */}
            <PhaseDots phase={phase} />
          </div>

          {/* Phase body */}
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            <AnimatePresence mode="wait" initial={false}>
              {phase === "compose" ? (
                <motion.div
                  key="compose"
                  initial={isMobile ? { opacity: 0 } : { opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.18 }}
                >
                  <TradeComposePanel
                    market={market}
                    initialOutcome={initialOutcome}
                    onContinue={(r) => {
                      setComposed(r);
                      setComposedMid(market.midYes);
                      setPhase("confirm");
                    }}
                    onCancel={close}
                  />
                </motion.div>
              ) : phase === "confirm" && composed ? (
                <motion.div
                  key="confirm"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.18 }}
                >
                  <TradeConfirmPanel
                    market={market}
                    draft={composed.draft}
                    quote={composed.quote}
                    midYesAtCompose={composedMid}
                    isSubmitting={chainExec.isPending}
                    canExecuteTrade={canExecuteTrade}
                    onBack={() => setPhase("compose")}
                    onConfirm={() => handleConfirm(composed.draft)}
                  />
                </motion.div>
              ) : phase === "result" && composed ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.18 }}
                >
                  <TradeResultPanel
                    market={market}
                    draft={composed.draft}
                    result={null}
                    chainTxHash={chainTxHash}
                    error={error}
                    onRetry={() => {
                      setError(null);
                      setChainTxHash(null);
                      setPhase("confirm");
                    }}
                    onTradeAgain={() => {
                      setError(null);
                      setChainTxHash(null);
                      setComposed(null);
                      setPhase("compose");
                    }}
                    onClose={close}
                  />
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          {chainExec.isPending && phase === "confirm" ? (
            <div
              className="absolute inset-0 z-[100] flex flex-col justify-end rounded-2xl bg-[#030308]/55 backdrop-blur-[6px]"
              aria-live="polite"
              aria-busy="true"
            >
              <div className="border-t border-white/[0.07] bg-[#06060f]/90 px-5 pb-5 pt-4 sm:rounded-b-2xl">
                <div className="mb-3 flex items-center justify-center gap-2">
                  <div
                    className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-500/20 border-t-cyan-400"
                    role="status"
                    aria-label="Posting trade"
                  />
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-400">
                    MetaMask · on-chain fill
                  </p>
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-white/[0.06]">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-violet-400"
                    initial={{ width: "8%", opacity: 0.85 }}
                    animate={{ width: ["8%", "92%", "35%", "100%"], opacity: [0.85, 1, 0.9, 1] }}
                    transition={{
                      duration: 2.4,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                </div>
                <p className="mt-2 text-center text-[10px] text-zinc-600">
                  Approve collateral if prompted, then confirm the trade in MetaMask…
                </p>
              </div>
            </div>
          ) : null}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function PhaseDots({ phase }: { phase: Phase }) {
  const order: Phase[] = ["compose", "confirm", "result"];
  const idx = order.indexOf(phase);
  return (
    <div
      aria-hidden
      className="absolute bottom-1 left-1/2 hidden -translate-x-1/2 items-center gap-1 sm:inline-flex"
    >
      {order.map((p, i) => (
        <span
          key={p}
          className={cn(
            "h-0.5 w-6 rounded-full transition-colors",
            i <= idx
              ? p === "result"
                ? "bg-emerald-400/80"
                : "bg-cyan-400/80"
              : "bg-white/10",
          )}
        />
      ))}
    </div>
  );
}
