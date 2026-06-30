"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronDown,
  Copy,
  ExternalLink,
  Briefcase,
  Loader2,
  LogOut,
  RadioTower,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAccount, useDisconnect } from "wagmi";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useChainCollateralBalance } from "@/features/chain-trading";
import { getBscTestnetUsdcFaucetUrl } from "@/lib/chain-public-env";
import { ROUTES } from "@/shared/constants/routes";
import { cn } from "@/lib/utils";

function truncate(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function StatusDot({ tone }: { tone: "ok" | "warn" | "err" | "idle" }) {
  const cls =
    tone === "ok"
      ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.55)]"
      : tone === "warn"
        ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.55)]"
        : tone === "err"
          ? "bg-rose-400"
          : "bg-zinc-500";
  return <span className={cn("h-1.5 w-1.5 rounded-full", cls)} />;
}

function ChainCollateralBalance({ address }: { address: `0x${string}` }) {
  const balanceQ = useChainCollateralBalance(address);
  const available = balanceQ.data?.formatted ?? 0;
  const symbol = balanceQ.data?.symbol ?? "USDC";

  return (
    <div className="grid grid-cols-1 gap-2 px-3 py-2.5">
      <div className="rounded-lg bg-white/[0.03] px-2.5 py-2 ring-1 ring-white/[0.05]">
        <p className="text-[9.5px] font-medium uppercase tracking-wider text-zinc-500">
          Trading collateral
        </p>
        <p className="mt-0.5 font-mono text-[14px] font-semibold text-white">
          {balanceQ.isLoading && !balanceQ.data
            ? "—"
            : `$${available.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          <span className="ml-1 text-[11px] font-normal text-zinc-500">{symbol}</span>
        </p>
        <p className="mt-0.5 text-[10px] text-zinc-600">On-chain · BSC testnet</p>
      </div>
    </div>
  );
}

export function WalletPopover({
  connectLabel = "Connect",
  variant = "default",
}: {
  connectLabel?: string;
  variant?: "default" | "hub";
}) {
  const faucetUrl = getBscTestnetUsdcFaucetUrl();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { address, status, chain: wagmiChain } = useAccount();
  const { disconnectAsync, isPending: disconnectPending } = useDisconnect();

  useEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => setCopied(false), 1400);
    return () => window.clearTimeout(id);
  }, [copied]);

  const connecting = status === "connecting" || status === "reconnecting";
  const connected = status === "connected" && Boolean(address);

  return (
    <ConnectButton.Custom>
      {({ account, chain, mounted, openConnectModal, openChainModal }) => {
        const wrongNetwork = connected && chain?.unsupported === true;
        if (!mounted) {
          return (
            <div
              role="status"
              aria-label="Loading wallet"
              className="hidden h-9 min-w-[7.5rem] animate-pulse rounded-[10px] border border-white/[0.06] bg-white/[0.04] sm:block"
            />
          );
        }

        if (!connected) {
          const hubStyle = variant === "hub";
          return (
            <motion.button
              type="button"
              disabled={connecting}
              onClick={openConnectModal}
              whileHover={connecting ? undefined : { scale: 1.01 }}
              whileTap={connecting ? undefined : { scale: 0.99 }}
              className={cn(
                "inline-flex h-9 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 text-sm font-semibold transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb]/35",
                "disabled:cursor-not-allowed disabled:opacity-60",
                hubStyle
                  ? "border border-[#2563eb] bg-[#2563eb] text-white hover:bg-[#1d4ed8]"
                  : cn(
                      "h-8 rounded-[3px] border px-3 font-mono text-[9.5px] font-semibold uppercase tracking-[0.07em]",
                      "border-[#3b82f6]/40 bg-[#3b82f6]/12 text-[#dbeafe]",
                      "shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]",
                      "hover:border-[#60a5fa]/50 hover:bg-[#3b82f6]/18 hover:text-white",
                      "focus-visible:ring-[#3b82f6]/40",
                    ),
              )}
            >
              {connecting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
                  <span>Connecting</span>
                </>
              ) : hubStyle ? (
                <span>{connectLabel}</span>
              ) : (
                <>
                  <Wallet className="h-3.5 w-3.5 shrink-0 text-blue-300/95" strokeWidth={2} />
                  <span>{connectLabel}</span>
                </>
              )}
            </motion.button>
          );
        }

        const addr = account?.address ?? address;
        if (!addr) {
          return (
            <div
              role="status"
              aria-label="Loading wallet"
              className="hidden h-9 min-w-[7.5rem] animate-pulse rounded-[10px] border border-white/[0.06] bg-white/[0.04] sm:block"
            />
          );
        }
        const display = `${addr.slice(0, 6)}...${addr.slice(-4)}`;
        const pendingTx = account?.hasPendingTransactions ?? false;

        return (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <motion.button
                type="button"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className={cn(
                  "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[10px] border bg-white/[0.03] px-2.5 pr-2.5 transition",
                  wrongNetwork
                    ? "border-rose-500/35 bg-rose-500/[0.07]"
                    : "border-white/[0.08] hover:border-white/[0.11] hover:bg-white/[0.06]",
                )}
              >
                <span className="relative">
                  <span className="flex h-[22px] w-[22px] items-center justify-center rounded-lg bg-white/[0.06] font-mono text-[9px] font-semibold uppercase tracking-tight text-emerald-300/95 ring-1 ring-white/[0.08]">
                    {addr.slice(2, 4)}
                  </span>
                  <AnimatePresence>
                    {pendingTx ? (
                      <motion.span
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                        className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-amber-400 text-zinc-950 ring-2 ring-[#06060a]"
                        aria-label="Pending"
                      >
                        <Loader2 className="h-2 w-2 animate-spin" />
                      </motion.span>
                    ) : (
                      <span
                        className={cn(
                          "absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full ring-2 ring-[#06060a]",
                          wrongNetwork
                            ? "bg-rose-400"
                            : "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]",
                        )}
                      />
                    )}
                  </AnimatePresence>
                </span>
                <span className="hidden font-mono text-[11.5px] font-semibold tracking-tight text-zinc-100 sm:inline">
                  {display}
                </span>
                <ChevronDown className="h-3 w-3 shrink-0 text-zinc-500" />
              </motion.button>
            </PopoverTrigger>

            <PopoverContent align="end" sideOffset={10} className="w-[300px] p-0">
              <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] px-3 py-2.5">
                <div className="flex min-w-0 items-center gap-2">
                  <StatusDot tone={wrongNetwork ? "err" : "ok"} />
                  <p className="truncate font-mono text-[12px] font-semibold tracking-tight text-zinc-100">
                    {display}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(addr);
                      setCopied(true);
                    } catch {
                      /* clipboard API may be unavailable in some browsers */
                    }
                  }}
                  aria-label="Copy address"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 transition hover:bg-white/[0.06] hover:text-zinc-100"
                >
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={copied ? "copied" : "copy"}
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.7 }}
                      transition={{ duration: 0.15 }}
                    >
                      {copied ? (
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
                          Copied
                        </span>
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </motion.span>
                  </AnimatePresence>
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  openChainModal();
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between gap-2 border-b border-white/[0.06] px-3 py-2 text-left transition",
                  wrongNetwork
                    ? "bg-rose-500/[0.08] hover:bg-rose-500/[0.12]"
                    : "hover:bg-white/[0.04]",
                )}
              >
                <span className="flex items-center gap-2">
                  <RadioTower
                    className={cn(
                      "h-3.5 w-3.5",
                      wrongNetwork ? "text-rose-300" : "text-cyan-300",
                    )}
                  />
                  <span className="text-[11.5px] font-medium text-zinc-200">
                    {wrongNetwork
                      ? "Unsupported network — switch"
                      : (chain?.name ?? "Unknown network")}
                  </span>
                </span>
                <ChevronDown className="h-3 w-3 -rotate-90 text-zinc-500" />
              </button>

              <ChainCollateralBalance address={addr as `0x${string}`} />

              <div className="grid grid-cols-2 gap-1.5 px-3 pb-2.5">
                <a
                  href={faucetUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-md bg-white/[0.05] px-2 py-1.5 text-[11.5px] font-medium text-zinc-200 ring-1 ring-white/[0.06] transition hover:bg-white/[0.08]"
                >
                  <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-300" />
                  Get USDC
                </a>
                <Link
                  href={ROUTES.wallet}
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-md bg-white/[0.05] px-2 py-1.5 text-[11.5px] font-medium text-zinc-200 ring-1 ring-white/[0.06] transition hover:bg-white/[0.08]"
                >
                  <ArrowUpRight className="h-3.5 w-3.5 text-cyan-300" />
                  Wallet
                </Link>
              </div>

              <div className="border-t border-white/[0.06] py-1">
                <Link
                  href={ROUTES.portfolio}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-[12px] text-zinc-200 transition hover:bg-white/[0.04]"
                >
                  <Briefcase className="h-3.5 w-3.5 text-zinc-400" />
                  Portfolio
                </Link>
                <a
                  href={
                    wagmiChain?.blockExplorers?.default?.url
                      ? `${wagmiChain.blockExplorers.default.url}/address/${addr}`
                      : `https://etherscan.io/address/${addr}`
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-3 py-2 text-[12px] text-zinc-200 transition hover:bg-white/[0.04]"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-zinc-400" />
                  View on explorer
                </a>
                <button
                  type="button"
                  disabled={disconnectPending}
                  onClick={async () => {
                    await disconnectAsync();
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] text-rose-300 transition hover:bg-rose-500/[0.1] disabled:opacity-60"
                >
                  {disconnectPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <LogOut className="h-3.5 w-3.5" />
                  )}
                  Disconnect
                </button>
              </div>
            </PopoverContent>
          </Popover>
        );
      }}
    </ConnectButton.Custom>
  );
}
