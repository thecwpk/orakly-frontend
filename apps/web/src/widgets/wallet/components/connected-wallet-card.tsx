"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  ExternalLink,
  Loader2,
  LogOut,
  Plug,
  RadioTower,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { memo, useEffect, useState } from "react";
import { toast } from "sonner";
import { useAccount, useDisconnect } from "wagmi";
import { useRequireTbnb } from "@/features/wallet";
import { ROUTES } from "@/shared/constants/routes";
import { cn } from "@/lib/utils";
import { shortAddress } from "../lib/format";

type Props = {
  /** SIWE-authenticated wallet (HTTP-only cookie session). `null` when not signed. */
  authedAddress: string | null;
};

function ConnectedWalletCardInner({ authedAddress }: Props) {
  const {
    address,
    chain,
    chainId,
    connector,
    isConnected,
    status,
  } = useAccount();
  const { disconnectAsync, isPending: disconnecting } = useDisconnect();
  const { isCorrectChain, ensureTbnb, isSwitching, targetChain } = useRequireTbnb();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => setCopied(false), 1500);
    return () => window.clearTimeout(id);
  }, [copied]);

  const isConnecting = status === "connecting" || status === "reconnecting";
  const explorerUrl = chain?.blockExplorers?.default?.url;
  const sessionMatchesWallet =
    authedAddress != null &&
    address != null &&
    authedAddress.toLowerCase() === address.toLowerCase();

  const handleCopy = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      toast.success("Address copied");
    } catch {
      toast.error("Could not copy");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05, duration: 0.35 }}
      className="glass-panel-strong overflow-hidden rounded-2xl ring-1 ring-white/[0.06]"
    >
      <header className="flex items-center justify-between gap-2 border-b border-white/[0.06] px-4 py-2.5 sm:px-5">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-cyan-500/10 text-cyan-300 ring-1 ring-cyan-400/25">
            <Plug className="h-3.5 w-3.5" />
          </span>
          <div>
            <p className="text-[9.5px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Identity
            </p>
            <p className="text-[13px] font-semibold text-white">Connected wallet</p>
          </div>
        </div>
        <ConnectionPill
          isConnected={isConnected}
          isConnecting={isConnecting}
          wrongNetwork={isConnected && !isCorrectChain}
        />
      </header>

      {!isConnected ? (
        <div className="flex flex-col items-center justify-center gap-3 px-4 py-8 text-center sm:px-5">
          <p className="text-[13px] font-medium text-zinc-200">No wallet connected</p>
          <p className="max-w-xs text-[11.5px] leading-snug text-zinc-500">
            Link MetaMask or any RainbowKit-supported wallet to deposit, withdraw, and trade.
          </p>
          <ConnectButton
            chainStatus="none"
            accountStatus="address"
            label="Connect wallet"
            showBalance={false}
          />
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-5">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500/35 via-teal-500/25 to-cyan-500/35 font-mono text-[11px] font-semibold uppercase text-white ring-1 ring-white/15">
                {address?.slice(2, 4) ?? "··"}
              </span>
              <div className="min-w-0">
                <p className="font-mono text-[13px] font-semibold tracking-tight text-zinc-100">
                  {shortAddress(address)}
                </p>
                <p className="font-mono text-[10px] text-zinc-500">
                  {connector?.name ?? "Wallet"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => void handleCopy()}
                aria-label="Copy address"
                className={cn(
                  "inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 ring-1 ring-white/[0.06] transition hover:bg-white/[0.06] hover:text-zinc-100",
                  copied && "bg-emerald-500/10 text-emerald-200 ring-emerald-400/25",
                )}
              >
                {copied ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
              {explorerUrl && address ? (
                <a
                  href={`${explorerUrl}/address/${address}`}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="View on explorer"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 ring-1 ring-white/[0.06] transition hover:bg-white/[0.06] hover:text-zinc-100"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : null}
            </div>
          </div>

          <dl className="space-y-1 border-t border-white/[0.06] px-4 py-2.5 text-[12px] sm:px-5">
            <RowKV
              label="Network"
              value={chain?.name ?? "Unknown"}
              status={isCorrectChain ? "ok" : "warn"}
            />
            <RowKV label="Chain ID" value={chainId != null ? String(chainId) : "N/A"} mono />
            <RowKV
              label="Session"
              value={sessionMatchesWallet ? "Authenticated" : "Not signed"}
              status={sessionMatchesWallet ? "ok" : "warn"}
            />
          </dl>

          {!isCorrectChain ? (
            <div className="mx-4 mb-3 flex flex-col items-start gap-2 rounded-lg bg-amber-500/[0.08] p-3 text-[12px] ring-1 ring-amber-400/25 sm:mx-5">
              <p className="flex items-center gap-1.5 font-medium text-amber-100">
                <AlertTriangle className="h-3.5 w-3.5" />
                Wrong network
              </p>
              <p className="text-[11px] leading-snug text-amber-200/80">
                Switch to {targetChain.name} (chain {targetChain.id}) to settle on Orakly.
              </p>
              <button
                type="button"
                onClick={() => void ensureTbnb()}
                disabled={isSwitching}
                className="inline-flex items-center gap-1.5 rounded-md bg-amber-400/90 px-2.5 py-1 text-[11px] font-bold text-zinc-950 transition hover:bg-amber-300 disabled:opacity-50"
              >
                {isSwitching ? <Loader2 className="h-3 w-3 animate-spin" /> : <RadioTower className="h-3 w-3" />}
                Switch
              </button>
            </div>
          ) : null}

          {!sessionMatchesWallet ? (
            <div className="mx-4 mb-3 flex flex-col items-start gap-2 rounded-lg bg-cyan-500/[0.07] p-3 text-[12px] ring-1 ring-cyan-400/25 sm:mx-5">
              <p className="flex items-center gap-1.5 font-medium text-cyan-100">
                <ShieldCheck className="h-3.5 w-3.5" />
                Sign session message
              </p>
              <p className="text-[11px] leading-snug text-cyan-200/80">
                Authenticate this wallet to unlock protected routes (1 tap, no gas).
              </p>
              <Link
                href={ROUTES.blockchainConnect}
                className="inline-flex items-center gap-1.5 rounded-md bg-cyan-400/90 px-2.5 py-1 text-[11px] font-bold text-zinc-950 transition hover:bg-cyan-300"
              >
                Sign now
              </Link>
            </div>
          ) : null}

          <div className="flex items-center gap-2 border-t border-white/[0.06] px-4 py-2.5 sm:px-5">
            <button
              type="button"
              onClick={async () => {
                await disconnectAsync();
                toast.success("Wallet disconnected");
              }}
              disabled={disconnecting}
              className="inline-flex items-center gap-1.5 rounded-md bg-rose-500/10 px-2.5 py-1.5 text-[11.5px] font-medium text-rose-200 ring-1 ring-rose-400/25 transition hover:bg-rose-500/15 disabled:opacity-50"
            >
              {disconnecting ? <Loader2 className="h-3 w-3 animate-spin" /> : <LogOut className="h-3 w-3" />}
              Disconnect
            </button>
          </div>
        </>
      )}
    </motion.div>
  );
}

function ConnectionPill({
  isConnected,
  isConnecting,
  wrongNetwork,
}: {
  isConnected: boolean;
  isConnecting: boolean;
  wrongNetwork: boolean;
}) {
  if (isConnecting) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-1.5 py-1 text-[10px] font-bold text-amber-200 ring-1 ring-amber-400/25">
        <Loader2 className="h-2.5 w-2.5 animate-spin" />
        Connecting
      </span>
    );
  }
  if (!isConnected) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-zinc-500/10 px-1.5 py-1 text-[10px] font-bold text-zinc-400 ring-1 ring-white/10">
        <span className="h-1.5 w-1.5 rounded-full bg-zinc-500" aria-hidden />
        Disconnected
      </span>
    );
  }
  if (wrongNetwork) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/10 px-1.5 py-1 text-[10px] font-bold text-rose-200 ring-1 ring-rose-400/25">
        <AlertTriangle className="h-2.5 w-2.5" />
        Wrong network
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-1.5 py-1 text-[10px] font-bold text-emerald-200 ring-1 ring-emerald-400/25">
      <span
        className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_2px_rgba(52,211,153,0.45)]"
        aria-hidden
      />
      Connected
    </span>
  );
}

function RowKV({
  label,
  value,
  mono,
  status,
}: {
  label: string;
  value: string;
  mono?: boolean;
  status?: "ok" | "warn";
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <dt className="text-[11px] uppercase tracking-wider text-zinc-500">{label}</dt>
      <dd
        className={cn(
          "flex items-center gap-1.5 text-[12px] text-zinc-200",
          mono && "font-mono tabular-nums",
        )}
      >
        {status ? (
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              status === "ok"
                ? "bg-emerald-400 shadow-[0_0_8px_2px_rgba(52,211,153,0.45)]"
                : "bg-amber-400",
            )}
            aria-hidden
          />
        ) : null}
        {value}
      </dd>
    </div>
  );
}

export const ConnectedWalletCard = memo(ConnectedWalletCardInner);
