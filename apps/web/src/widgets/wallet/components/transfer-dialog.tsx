"use client";

import { Dialog as DialogPrimitive } from "radix-ui";
import { motion } from "framer-motion";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  X,
} from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { compactUsd, fullUsd, shortAddress } from "../lib/format";
import { useWalletMovementsStore } from "../store/wallet-movements-store";

export type TransferKind = "DEPOSIT" | "WITHDRAW";

const PRESETS_DEPOSIT = [50, 250, 1000] as const;
const PRESETS_WITHDRAW = [25, 100, 500] as const;

type Phase = "compose" | "confirm" | "success";

function fakeTxHash(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `0x${crypto.randomUUID().replaceAll("-", "")}`.slice(0, 42);
  }
  return `0x${Math.random().toString(16).slice(2)}${Date.now().toString(16)}`.slice(0, 42);
}

function TransferDialogInner({
  open,
  kind,
  onOpenChange,
  availableUsd,
  walletAddress,
  networkLabel,
}: {
  open: boolean;
  kind: TransferKind;
  onOpenChange: (next: boolean) => void;
  availableUsd: number;
  walletAddress: string | null;
  networkLabel?: string | null;
}) {
  const [amount, setAmount] = useState("");
  const [phase, setPhase] = useState<Phase>("compose");
  const [submittedHash, setSubmittedHash] = useState<string | null>(null);

  const addMovement = useWalletMovementsStore((s) => s.add);
  const patchMovement = useWalletMovementsStore((s) => s.patch);

  // Reset state when dialog reopens or kind changes.
  useEffect(() => {
    if (open) {
      setAmount("");
      setPhase("compose");
      setSubmittedHash(null);
    }
  }, [open, kind]);

  const isDeposit = kind === "DEPOSIT";
  const presets = isDeposit ? PRESETS_DEPOSIT : PRESETS_WITHDRAW;
  const numericAmount = useMemo(() => {
    const n = Number.parseFloat(amount);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }, [amount]);

  const exceedsAvailable =
    !isDeposit && numericAmount > availableUsd && availableUsd > 0;
  const lowAmount = numericAmount < 1;

  const blockingError = !walletAddress
    ? "Connect a wallet first."
    : lowAmount
      ? "Enter an amount above $1."
      : exceedsAvailable
        ? "Amount exceeds available balance."
        : null;

  const submit = useCallback(async () => {
    if (blockingError || !walletAddress) return;
    const id = addMovement({
      kind,
      amountUsd: numericAmount,
      status: "PENDING",
      fromAddress: walletAddress,
      hash: fakeTxHash(),
    });

    // Simulate network confirmation. Prod would await an on-chain receipt
    // (or the backend's deposit-detected webhook).
    await new Promise((resolve) => setTimeout(resolve, 1200));

    const hash = fakeTxHash();
    patchMovement(id, { status: "CONFIRMED", hash });
    setSubmittedHash(hash);
    setPhase("success");
    toast.success(isDeposit ? "Deposit confirmed" : "Withdrawal queued", {
      description: `${fullUsd(numericAmount)} · ${shortAddress(walletAddress)}`,
    });
  }, [
    blockingError,
    walletAddress,
    addMovement,
    kind,
    numericAmount,
    patchMovement,
    isDeposit,
  ]);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
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
            "inset-x-0 bottom-0 rounded-t-2xl",
            "sm:inset-auto sm:left-1/2 sm:top-1/2 sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl",
            "bg-[#0a0a12] text-zinc-100 ring-1 ring-white/[0.08] shadow-[0_20px_80px_-20px_rgba(0,0,0,0.6)]",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
            "data-[state=open]:slide-in-from-bottom-4 data-[state=closed]:slide-out-to-bottom-4",
            "sm:data-[state=open]:zoom-in-95 sm:data-[state=closed]:zoom-out-95",
            "outline-none",
          )}
        >
          <div
            aria-hidden
            className="mx-auto mt-2 h-1 w-10 rounded-full bg-white/10 sm:hidden"
          />

          <header className="flex items-start justify-between gap-3 border-b border-white/[0.06] px-5 pb-3 pt-4">
            <div className="min-w-0">
              <DialogPrimitive.Title asChild>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
                  {isDeposit ? "Deposit" : "Withdraw"}
                </p>
              </DialogPrimitive.Title>
              <p className="mt-1 text-[14px] font-semibold text-white">
                {isDeposit ? "Fund your trading wallet" : "Move USD off Orakly"}
              </p>
              <p className="mt-1 text-[10.5px] text-zinc-500">
                {walletAddress ? (
                  <>
                    From{" "}
                    <span className="font-mono text-zinc-300">
                      {shortAddress(walletAddress)}
                    </span>
                    {networkLabel ? <> · {networkLabel}</> : null}
                  </>
                ) : (
                  "No wallet connected"
                )}
              </p>
            </div>
            <DialogPrimitive.Close
              aria-label="Close"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/[0.04] text-zinc-300 ring-1 ring-white/[0.08] transition hover:bg-white/[0.08] hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </DialogPrimitive.Close>
          </header>

          {phase === "success" && submittedHash ? (
            <SuccessPanel
              kind={kind}
              amount={numericAmount}
              hash={submittedHash}
              onClose={() => onOpenChange(false)}
            />
          ) : (
            <ComposeBody
              kind={kind}
              amount={amount}
              setAmount={setAmount}
              presets={presets}
              numericAmount={numericAmount}
              availableUsd={availableUsd}
              blockingError={blockingError}
              isPending={phase === "confirm"}
              onSubmit={() => {
                setPhase("confirm");
                void submit();
              }}
              onCancel={() => onOpenChange(false)}
            />
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function ComposeBody({
  kind,
  amount,
  setAmount,
  presets,
  numericAmount,
  availableUsd,
  blockingError,
  isPending,
  onSubmit,
  onCancel,
}: {
  kind: TransferKind;
  amount: string;
  setAmount: (next: string) => void;
  presets: readonly number[];
  numericAmount: number;
  availableUsd: number;
  blockingError: string | null;
  isPending: boolean;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  const isDeposit = kind === "DEPOSIT";
  const Icon = isDeposit ? ArrowDownToLine : ArrowUpFromLine;

  return (
    <div className="flex flex-col gap-3.5 px-5 py-4">
      <label className="block text-[10.5px] font-semibold uppercase tracking-wider text-zinc-500">
        Amount (USD)
      </label>
      <div
        className={cn(
          "flex h-16 items-center rounded-xl bg-black/40 ring-1 transition focus-within:ring-2",
          blockingError === "Amount exceeds available balance."
            ? "ring-rose-400/40 focus-within:ring-rose-400/60"
            : "ring-white/[0.08] focus-within:ring-cyan-400/40",
        )}
      >
        <span className="ml-4 select-none font-mono text-2xl font-semibold text-zinc-500">
          $
        </span>
        <input
          inputMode="decimal"
          spellCheck={false}
          autoComplete="off"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
          placeholder="0.00"
          aria-label="Amount in USD"
          autoFocus
          className="h-full min-w-0 flex-1 bg-transparent px-3 font-mono text-2xl font-semibold tabular-nums text-white outline-none placeholder:text-zinc-700"
        />
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {presets.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setAmount(String(n))}
            className="rounded-md bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-zinc-300 ring-1 ring-white/[0.08] transition hover:bg-white/[0.08] hover:text-zinc-100"
          >
            ${n}
          </button>
        ))}
        {!isDeposit && availableUsd > 0 ? (
          <button
            type="button"
            onClick={() => setAmount(availableUsd.toFixed(2))}
            className="rounded-md bg-cyan-500/10 px-2.5 py-1 text-[11px] font-bold text-cyan-200 ring-1 ring-cyan-400/30 transition hover:bg-cyan-500/15"
          >
            MAX
          </button>
        ) : null}
        <span className="ml-auto inline-flex items-center gap-1 text-[10.5px] text-zinc-500">
          {isDeposit ? "Cap" : "Available"}
          <span className="font-mono tabular-nums text-zinc-300">
            {compactUsd(isDeposit ? 100_000 : availableUsd)}
          </span>
        </span>
      </div>

      <div className="space-y-1.5 rounded-xl bg-black/30 px-3.5 py-3 ring-1 ring-white/[0.06]">
        <div className="mb-1 flex items-center justify-between text-[10.5px] font-semibold uppercase tracking-wider text-zinc-500">
          <span>Transaction preview</span>
          <span className="font-mono text-[10px] text-zinc-600">demo · t+1.2s</span>
        </div>
        <Row label="Direction" value={isDeposit ? "On-chain → Custodial" : "Custodial → On-chain"} />
        <Row label="Amount" value={fullUsd(numericAmount)} emphasis="primary" />
        <Row label="Network fee" value={fullUsd(0)} hint="Sponsored" />
        <div className="mt-1 border-t border-white/[0.05] pt-1.5">
          <Row
            label={isDeposit ? "You will credit" : "You will debit"}
            value={fullUsd(numericAmount)}
            emphasis="primary"
          />
        </div>
      </div>

      <p className="flex items-start gap-1.5 text-[10.5px] text-zinc-500">
        <ShieldCheck className="mt-0.5 h-3 w-3 shrink-0 text-emerald-400/80" />
        Demo transfer — confirms locally for previewing balance updates and
        transaction history. Production will route through the on-chain settlement
        service.
      </p>

      {blockingError ? (
        <p
          role="alert"
          className="rounded-lg bg-rose-500/10 px-3 py-2 text-[12px] text-rose-200 ring-1 ring-rose-400/25"
        >
          {blockingError}
        </p>
      ) : null}

      <div className="grid grid-cols-[1fr_2fr] gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="h-12 rounded-xl bg-white/[0.04] text-[13px] font-semibold text-zinc-300 ring-1 ring-white/[0.08] transition hover:bg-white/[0.08] hover:text-white disabled:opacity-50"
        >
          Cancel
        </button>
        <motion.button
          type="button"
          onClick={onSubmit}
          disabled={!!blockingError || isPending}
          whileTap={{ scale: 0.99 }}
          className={cn(
            "relative inline-flex h-12 items-center justify-center gap-2 overflow-hidden rounded-xl text-[13px] font-bold ring-1 transition",
            "disabled:cursor-not-allowed disabled:opacity-40",
            "bg-gradient-to-r from-emerald-400 to-cyan-400 text-zinc-950 ring-cyan-300/30 hover:brightness-110",
          )}
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Submitting…
            </>
          ) : (
            <>
              <Icon className="h-3.5 w-3.5" />
              Confirm {isDeposit ? "deposit" : "withdrawal"}
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
}

function SuccessPanel({
  kind,
  amount,
  hash,
  onClose,
}: {
  kind: TransferKind;
  amount: number;
  hash: string;
  onClose: () => void;
}) {
  const isDeposit = kind === "DEPOSIT";
  return (
    <div className="flex flex-col gap-4 px-5 py-5">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 320, damping: 20 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500/15 via-cyan-500/8 to-transparent p-5 text-center ring-1 ring-emerald-400/30"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-emerald-500/30 blur-3xl"
        />
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 ring-1 ring-emerald-400/40">
          <CheckCircle2 className="h-6 w-6 text-emerald-200" />
        </div>
        <p className="mt-3 text-base font-semibold tracking-tight text-white">
          {isDeposit ? "Deposit confirmed" : "Withdrawal queued"}
        </p>
        <p className="mt-1 text-[12px] leading-relaxed text-zinc-300">
          {isDeposit ? "+" : "−"}
          <span className="font-mono">{fullUsd(amount)}</span>{" "}
          credited to your trading balance.
        </p>
      </motion.div>

      <div className="space-y-1.5 rounded-xl bg-black/30 px-3.5 py-3 ring-1 ring-white/[0.06]">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-zinc-500">Tx hash</span>
          <span className="truncate font-mono tabular-nums text-zinc-200">
            {hash.slice(0, 16)}…{hash.slice(-6)}
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-zinc-500">Status</span>
          <span className="font-mono text-emerald-200">Confirmed</span>
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="h-12 rounded-xl bg-white/[0.05] text-[13px] font-semibold text-zinc-200 ring-1 ring-white/[0.08] transition hover:bg-white/[0.1]"
      >
        Done
      </button>
    </div>
  );
}

function Row({
  label,
  value,
  emphasis,
  hint,
}: {
  label: string;
  value: string;
  emphasis?: "primary";
  hint?: string;
}) {
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
      <span
        className={cn(
          "font-mono font-medium tabular-nums",
          emphasis === "primary" ? "text-cyan-100" : "text-zinc-200",
        )}
      >
        {value}
      </span>
    </div>
  );
}

export const TransferDialog = memo(TransferDialogInner);
