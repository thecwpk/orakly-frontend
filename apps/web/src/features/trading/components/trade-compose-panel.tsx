"use client";

import { motion } from "framer-motion";
import { ArrowDownLeft, ArrowUpRight, Loader2, Wallet } from "lucide-react";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import {
  useMarketQuoteDebouncedQuery,
  usePortfolioQuery,
} from "@/shared/api/hooks";
import {
  clamp,
  enrichQuote,
  formatCents,
  formatPct,
  formatShares,
  formatUsd,
  parseFloatSafe,
  summarizePayout,
  usdToShares,
  type EnrichedQuote,
} from "../lib/trade-math";
import type { TradeModalMarket } from "../store/use-trade-modal-store";
import { useAuthStore } from "@/state/stores/auth.store";
import { TradeComposeSkeleton } from "./trade-compose-skeleton";
import { cn } from "@/lib/utils";

type Direction = "BUY" | "SELL";
type AmountMode = "USD" | "SHARES";

const PRESET_USD = [10, 50, 100] as const;

export type TradeDraft = {
  outcome: "YES" | "NO";
  direction: Direction;
  /** Quantity in shares (canonical — backend wants shares). */
  shares: number;
  /** Mirror in USD for display. */
  usd: number;
};

export type TradeComposeResult = {
  draft: TradeDraft;
  quote: EnrichedQuote;
};

function ModeToggle({
  mode,
  onChange,
}: {
  mode: AmountMode;
  onChange: (m: AmountMode) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Amount mode"
      className="inline-flex items-center gap-0.5 rounded-md bg-black/30 p-0.5 ring-1 ring-white/[0.08]"
    >
      {(["USD", "SHARES"] as const).map((m) => {
        const active = mode === m;
        return (
          <button
            key={m}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(m)}
            className={cn(
              "rounded-sm px-2.5 py-1.5 text-[10.5px] font-bold transition active:scale-95 sm:py-1",
              "min-h-8 sm:min-h-0",
              active
                ? "bg-white/[0.08] text-zinc-100 ring-1 ring-white/[0.08]"
                : "text-zinc-500 hover:text-zinc-300",
            )}
          >
            {m === "USD" ? "USD" : "Shares"}
          </button>
        );
      })}
    </div>
  );
}

function OutcomeButton({
  outcome,
  active,
  onClick,
  priceCents,
  disabled,
}: {
  outcome: "YES" | "NO";
  active: boolean;
  onClick: () => void;
  priceCents: string;
  disabled?: boolean;
}) {
  const isYes = outcome === "YES";
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      disabled={disabled}
      aria-pressed={active}
      className={cn(
        "group relative flex h-14 items-center justify-between gap-2 overflow-hidden rounded-xl px-3.5 text-left transition",
        "ring-1 disabled:cursor-not-allowed disabled:opacity-40",
        active
          ? isYes
            ? "bg-cyan-500/15 text-cyan-100 ring-cyan-400/40 shadow-[inset_0_0_0_1px_rgba(34,211,238,0.18)]"
            : "bg-rose-500/15 text-rose-100 ring-rose-400/40 shadow-[inset_0_0_0_1px_rgba(251,113,133,0.18)]"
          : "bg-white/[0.03] text-zinc-300 ring-white/[0.08] hover:bg-white/[0.07] hover:text-zinc-100",
      )}
    >
      {active ? (
        <motion.span
          aria-hidden
          layoutId="trade-modal-outcome-glow"
          className={cn(
            "pointer-events-none absolute inset-0 -z-10 rounded-xl",
            isYes
              ? "bg-gradient-to-br from-cyan-500/30 via-cyan-500/10 to-transparent"
              : "bg-gradient-to-br from-rose-500/30 via-rose-500/10 to-transparent",
          )}
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
        />
      ) : null}
      <span className="flex flex-col leading-tight">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-70">
          Buy
        </span>
        <span className="text-[15px] font-semibold">{outcome}</span>
      </span>
      <span
        className={cn(
          "rounded-md px-2 py-1 font-mono text-[12px] tabular-nums ring-1",
          active
            ? isYes
              ? "bg-cyan-400/15 text-cyan-100 ring-cyan-400/30"
              : "bg-rose-400/15 text-rose-100 ring-rose-400/30"
            : "bg-white/[0.04] text-zinc-300 ring-white/[0.06]",
        )}
      >
        {priceCents}
      </span>
    </motion.button>
  );
}

function StatRow({
  label,
  value,
  emphasis,
  monospace = true,
  hint,
}: {
  label: string;
  value: string;
  emphasis?: "primary" | "danger" | "success";
  monospace?: boolean;
  hint?: string;
}) {
  const cls =
    emphasis === "danger"
      ? "text-rose-200"
      : emphasis === "success"
        ? "text-emerald-200"
        : emphasis === "primary"
          ? "text-cyan-100"
          : "text-zinc-200";
  return (
    <div className="flex items-baseline justify-between gap-3 text-[12px]">
      <span className="text-[11px] uppercase tracking-wider text-zinc-500">
        {label}
        {hint ? (
          <span className="ml-1 normal-case tracking-normal text-zinc-600">
            {hint}
          </span>
        ) : null}
      </span>
      <span className={cn("font-medium", monospace && "font-mono tabular-nums", cls)}>
        {value}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function TradeComposePanelInner({
  market,
  initialOutcome,
  onContinue,
  onCancel,
}: {
  market: TradeModalMarket;
  initialOutcome: "YES" | "NO";
  onContinue: (result: TradeComposeResult) => void;
  onCancel: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [outcome, setOutcome] = useState<"YES" | "NO">(initialOutcome);
  const [direction, setDirection] = useState<Direction>("BUY");
  const [mode, setMode] = useState<AmountMode>("USD");

  // Canonical state is `shares`; USD is derived for display when in SHARES mode
  // and authoritative when in USD mode (we re-derive shares on change).
  const [usdInput, setUsdInput] = useState<string>("25");
  const [sharesInput, setSharesInput] = useState<string>("");

  const actorId = useAuthStore((s) => s.tradingUserId ?? undefined);

  // Wallet (optional until user signs in — guests can still preview quotes).
  const portfolio = usePortfolioQuery(actorId);
  const balance = parseFloatSafe(
    portfolio.data?.wallet?.availableBalanceUsd ?? null,
  );

  // Live quote (debounced) — driven by shares
  const sharesNum = useMemo(() => {
    if (mode === "USD") {
      const usd = parseFloatSafe(usdInput) ?? 0;
      const px = outcome === "YES" ? market.midYes : 1 - market.midYes;
      return usdToShares(usd, px, 25);
    }
    return parseFloatSafe(sharesInput) ?? 0;
  }, [mode, usdInput, sharesInput, outcome, market.midYes]);

  const quoteQuery = useMarketQuoteDebouncedQuery(
    market.tradeMarketId ?? undefined,
    {
      outcome,
      direction,
      quantity: String(sharesNum.toFixed(4)),
    },
  );

  const enriched = useMemo(
    () =>
      enrichQuote(quoteQuery.data, {
        midYes: market.midYes,
        quantity: sharesNum,
        direction,
        outcome,
      }),
    [quoteQuery.data, market.midYes, sharesNum, direction, outcome],
  );

  const payout = useMemo(() => summarizePayout(enriched), [enriched]);

  // Mirror canonical shares back into the *other* input on mode flip.
  useEffect(() => {
    if (mode === "USD") {
      setSharesInput(formatShares(sharesNum));
    } else {
      setUsdInput(enriched.totalDebitUsd.toFixed(2));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // Autofocus the input when the panel mounts.
  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  // ── Validation
  const composeEnabled =
    Boolean(market.tradeMarketId) && market.status === "OPEN";
  const exceedsBalance =
    actorId != null &&
    direction === "BUY" &&
    balance != null &&
    enriched.totalDebitUsd > balance;
  const lowAmount = sharesNum <= 0 || enriched.totalDebitUsd < 0.01;

  const blockingError = !market.tradeMarketId
    ? "Market is not yet wired for trading on this network."
    : market.status !== "OPEN"
      ? `This market is ${market.status.toLowerCase()} — trading disabled.`
      : exceedsBalance
        ? "Amount exceeds available balance."
        : lowAmount
          ? "Enter an amount above $0.01."
          : null;

  // ── Quick presets
  const setPresetUsd = (n: number) => {
    setMode("USD");
    setUsdInput(String(n));
  };

  const setMaxUsd = () => {
    if (balance == null || balance <= 0) return;
    setMode("USD");
    setUsdInput(clamp(balance, 0, balance).toFixed(2));
  };

  const onContinueClick = () => {
    if (blockingError || !composeEnabled) return;
    onContinue({
      draft: {
        outcome,
        direction,
        shares: sharesNum,
        usd: enriched.totalDebitUsd,
      },
      quote: enriched,
    });
  };

  // ── Direction toggle (BUY / SELL) — secondary control
  const directionOptions: ReadonlyArray<{
    id: Direction;
    label: string;
    icon: typeof ArrowUpRight;
  }> = [
    { id: "BUY", label: "Buy", icon: ArrowUpRight },
    { id: "SELL", label: "Sell", icon: ArrowDownLeft },
  ];

  const showWalletSkeleton = portfolio.isLoading && !portfolio.data;

  return (
    <div className="relative">
      {showWalletSkeleton ? (
        <div
          className="absolute inset-0 z-20 flex justify-center rounded-xl bg-[#080812]/90 p-3 pt-5 ring-1 ring-cyan-500/15 backdrop-blur-[4px] supports-[backdrop-filter]:bg-[#080812]/78"
          aria-busy="true"
          aria-label="Loading wallet and quote"
        >
          <TradeComposeSkeleton className="w-full max-w-full" />
        </div>
      ) : null}

      <div
        className={cn(
          "flex flex-col gap-4",
          showWalletSkeleton && "pointer-events-none select-none opacity-[0.22]",
        )}
      >
      {/* Outcome (YES/NO) ─── primary control */}
      <div className="grid grid-cols-2 gap-2">
        <OutcomeButton
          outcome="YES"
          active={outcome === "YES"}
          onClick={() => setOutcome("YES")}
          priceCents={formatCents(market.midYes)}
          disabled={!composeEnabled}
        />
        <OutcomeButton
          outcome="NO"
          active={outcome === "NO"}
          onClick={() => setOutcome("NO")}
          priceCents={formatCents(1 - market.midYes)}
          disabled={!composeEnabled}
        />
      </div>

      {/* Direction + amount mode row */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex items-center gap-0.5 rounded-md bg-black/30 p-0.5 ring-1 ring-white/[0.08]">
          {directionOptions.map((opt) => {
            const active = direction === opt.id;
            const isBuy = opt.id === "BUY";
            const Icon = opt.icon;
            return (
              <button
                key={opt.id}
                type="button"
                aria-pressed={active}
                onClick={() => setDirection(opt.id)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-sm px-3 py-1.5 text-[11px] font-bold transition active:scale-95 sm:px-2.5 sm:py-1",
                  "min-h-8 sm:min-h-0",
                  active
                    ? isBuy
                      ? "bg-emerald-500/15 text-emerald-100 ring-1 ring-emerald-400/30"
                      : "bg-rose-500/15 text-rose-100 ring-1 ring-rose-400/30"
                    : "text-zinc-500 hover:text-zinc-300",
                )}
              >
                <Icon className="h-3 w-3" />
                {opt.label}
              </button>
            );
          })}
        </div>
        <ModeToggle mode={mode} onChange={setMode} />
      </div>

      {/* Amount input */}
      <div className="space-y-2">
        <label className="block text-[10.5px] font-semibold uppercase tracking-wider text-zinc-500">
          {mode === "USD" ? "Amount (USD)" : "Shares"}
        </label>
        <div
          className={cn(
            "group relative flex h-16 items-center rounded-xl bg-black/40 ring-1 transition focus-within:ring-2",
            blockingError === "Amount exceeds available balance."
              ? "ring-rose-400/40 focus-within:ring-rose-400/60"
              : "ring-white/[0.08] focus-within:ring-cyan-400/40",
          )}
        >
          {mode === "USD" ? (
            <span className="ml-4 select-none font-mono text-2xl font-semibold text-zinc-500">
              $
            </span>
          ) : null}
          <input
            ref={inputRef}
            inputMode="decimal"
            spellCheck={false}
            autoComplete="off"
            value={mode === "USD" ? usdInput : sharesInput}
            onChange={(e) => {
              const v = e.target.value.replace(/[^0-9.]/g, "");
              if (mode === "USD") setUsdInput(v);
              else setSharesInput(v);
            }}
            placeholder={mode === "USD" ? "0.00" : "0"}
            aria-label={mode === "USD" ? "Amount in USD" : "Number of shares"}
            className="h-full min-w-0 flex-1 bg-transparent px-3 font-mono text-2xl font-semibold tabular-nums text-white outline-none placeholder:text-zinc-700"
          />
          <span className="mr-4 hidden select-none text-[11px] font-medium text-zinc-500 sm:inline">
            {mode === "USD"
              ? `≈ ${formatShares(sharesNum)} ${outcome}`
              : `≈ ${formatUsd(enriched.totalDebitUsd)}`}
          </span>
        </div>

        {/* Presets — denser on desktop, finger-friendly on mobile (min 36–40px tall) */}
        <div className="flex flex-wrap items-center gap-1.5">
          {PRESET_USD.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setPresetUsd(n)}
              className="min-h-9 rounded-md bg-white/[0.04] px-3 py-1.5 text-[11.5px] font-medium text-zinc-300 ring-1 ring-white/[0.08] transition hover:bg-white/[0.08] hover:text-zinc-100 active:scale-95 sm:min-h-0 sm:px-2.5 sm:py-1 sm:text-[11px]"
            >
              ${n}
            </button>
          ))}
          <button
            type="button"
            onClick={setMaxUsd}
            disabled={!balance || balance <= 0}
            className="min-h-9 rounded-md bg-cyan-500/10 px-3 py-1.5 text-[11.5px] font-bold text-cyan-200 ring-1 ring-cyan-400/30 transition hover:bg-cyan-500/15 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 sm:min-h-0 sm:px-2.5 sm:py-1 sm:text-[11px]"
          >
            MAX
          </button>
          <span className="ml-auto inline-flex items-center gap-1 text-[10.5px] text-zinc-500">
            <Wallet className="h-3 w-3" />
            <span>Balance</span>
            <span className="font-mono tabular-nums text-zinc-300">
              {balance != null ? formatUsd(balance) : portfolio.isLoading ? "…" : "—"}
            </span>
          </span>
        </div>
      </div>

      {/* Live preview */}
      <div className="space-y-1.5 rounded-xl bg-black/30 px-3.5 py-3 ring-1 ring-white/[0.06]">
        <div className="mb-1 flex items-center justify-between text-[10.5px] font-semibold uppercase tracking-wider text-zinc-500">
          <span>Transaction preview</span>
          {quoteQuery.isFetching ? (
            <span className="inline-flex items-center gap-1 text-[10px] text-zinc-500">
              <Loader2 className="h-2.5 w-2.5 animate-spin" />
              quoting
            </span>
          ) : null}
        </div>
        <StatRow
          label="Shares"
          value={`${formatShares(enriched.quantity)} ${outcome}`}
        />
        <StatRow
          label="Avg price"
          value={formatCents(enriched.execPrice)}
          hint={`mid ${formatCents(market.midYes)}`}
        />
        <StatRow
          label="Notional"
          value={formatUsd(enriched.notionalUsd)}
        />
        <StatRow
          label="Fee"
          value={formatUsd(enriched.feeUsd)}
          hint={`(${enriched.takerFeeBps} bps)`}
        />
        <div className="mt-1.5 border-t border-white/[0.05] pt-1.5">
          <StatRow
            label={direction === "BUY" ? "Total cost" : "Net credit"}
            value={formatUsd(
              direction === "BUY"
                ? enriched.totalDebitUsd
                : enriched.netCreditUsd,
            )}
            emphasis="primary"
          />
        </div>
      </div>

      {/* Outcome card */}
      <div className="grid grid-cols-3 gap-2 rounded-xl bg-gradient-to-br from-emerald-500/[0.06] via-cyan-500/[0.04] to-transparent p-3 ring-1 ring-emerald-500/15">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-zinc-500">
            Max payout
          </p>
          <p className="mt-1 font-mono text-sm font-semibold tabular-nums text-emerald-200">
            {formatUsd(payout.maxPayoutUsd)}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-zinc-500">
            Max profit
          </p>
          <p className="mt-1 font-mono text-sm font-semibold tabular-nums text-emerald-200">
            {formatUsd(payout.maxProfitUsd, { sign: true })}
          </p>
          <p className="font-mono text-[10px] tabular-nums text-emerald-300/70">
            {formatPct(payout.maxRoi, 0)} ROI
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-zinc-500">
            Max loss
          </p>
          <p className="mt-1 font-mono text-sm font-semibold tabular-nums text-rose-200">
            {formatUsd(-payout.maxLossUsd, { sign: false })}
          </p>
        </div>
      </div>

      {blockingError ? (
        <p
          role="alert"
          className="rounded-lg bg-rose-500/10 px-3 py-2 text-[12px] text-rose-200 ring-1 ring-rose-400/25"
        >
          {blockingError}
        </p>
      ) : null}

      {/* Footer actions — sticky on mobile so the CTA never scrolls out of reach */}
      <div className="sticky bottom-0 -mx-1 grid grid-cols-[1fr_2fr] gap-2 bg-gradient-to-t from-[#080812] via-[#080812]/95 to-transparent px-1 pb-[max(env(safe-area-inset-bottom),0.25rem)] pt-3 sm:static sm:m-0 sm:bg-none sm:p-0 sm:pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="h-12 rounded-xl bg-white/[0.04] text-[13px] font-semibold text-zinc-300 ring-1 ring-white/[0.08] transition hover:bg-white/[0.08] hover:text-white active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/30"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onContinueClick}
          disabled={!!blockingError}
          className={cn(
            "relative h-12 overflow-hidden rounded-xl text-[13px] font-bold ring-1 transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/40",
            "disabled:cursor-not-allowed disabled:opacity-40",
            outcome === "YES"
              ? "bg-gradient-to-r from-cyan-500 to-emerald-500 text-zinc-950 ring-cyan-300/40 hover:brightness-110"
              : "bg-gradient-to-r from-rose-500 to-violet-500 text-white ring-rose-300/40 hover:brightness-110",
          )}
        >
          Review trade →
        </button>
      </div>
      </div>
    </div>
  );
}

export const TradeComposePanel = memo(TradeComposePanelInner);
