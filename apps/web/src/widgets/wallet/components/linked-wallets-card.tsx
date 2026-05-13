"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { motion } from "framer-motion";
import { CheckCircle2, ExternalLink, Plus, ShieldCheck, Users, Wallet } from "lucide-react";
import { memo } from "react";
import { useAccount } from "wagmi";
import { cn } from "@/lib/utils";
import { shortAddress } from "../lib/format";

export type LinkedWalletEntry = {
  address: string;
  /** True for the wallet currently active in wagmi. */
  isActive: boolean;
  /** True for the wallet matching the SIWE session cookie. */
  isAuthenticated: boolean;
  /** Optional explorer URL — when set, shows external link button. */
  explorerHref?: string;
  /** Optional connector / source label, e.g. `MetaMask`, `WalletConnect`. */
  source?: string | null;
};

function LinkedWalletsCardInner({
  authedAddress,
  explorerBase,
}: {
  authedAddress: string | null;
  explorerBase?: string | null;
}) {
  const { address: activeAddress, connector, isConnected } = useAccount();

  const entries: LinkedWalletEntry[] = [];

  if (activeAddress) {
    entries.push({
      address: activeAddress,
      isActive: true,
      isAuthenticated:
        authedAddress != null &&
        authedAddress.toLowerCase() === activeAddress.toLowerCase(),
      explorerHref: explorerBase ? `${explorerBase}/address/${activeAddress}` : undefined,
      source: connector?.name ?? "Wallet",
    });
  }

  if (
    authedAddress &&
    (!activeAddress || authedAddress.toLowerCase() !== activeAddress.toLowerCase())
  ) {
    entries.push({
      address: authedAddress,
      isActive: false,
      isAuthenticated: true,
      explorerHref: explorerBase ? `${explorerBase}/address/${authedAddress}` : undefined,
      source: "Session",
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.35 }}
      className="glass-panel-strong overflow-hidden rounded-2xl ring-1 ring-white/[0.06]"
    >
      <header className="flex items-center justify-between gap-2 border-b border-white/[0.06] px-4 py-2.5 sm:px-5">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-400/25">
            <Users className="h-3.5 w-3.5" />
          </span>
          <div>
            <p className="text-[9.5px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Identity
            </p>
            <p className="text-[13px] font-semibold text-white">Linked wallets</p>
          </div>
        </div>
        <span className="font-mono text-[10px] text-zinc-500">{entries.length} linked</span>
      </header>

      {entries.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-4 py-7 text-center sm:px-5">
          <Wallet className="h-5 w-5 text-zinc-600" />
          <p className="text-[12px] font-medium text-zinc-200">No wallets linked yet</p>
          <p className="max-w-xs text-[11px] leading-snug text-zinc-500">
            Connect a wallet to bind it to your Orakly identity and unlock on-chain settlement.
          </p>
          <ConnectButton chainStatus="none" accountStatus="address" label="Link a wallet" showBalance={false} />
        </div>
      ) : (
        <>
          <ul className="divide-y divide-white/[0.04]">
            {entries.map((e) => (
              <li
                key={e.address}
                className="flex items-center gap-3 px-4 py-2.5 sm:px-5"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-emerald-500/35 via-teal-500/25 to-cyan-500/35 font-mono text-[10px] font-semibold uppercase text-white ring-1 ring-white/15">
                  {e.address.slice(2, 4)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[12.5px] font-semibold tracking-tight text-zinc-100">
                    {shortAddress(e.address)}
                  </p>
                  <p className="font-mono text-[10px] text-zinc-500">
                    {e.source ?? "Wallet"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {e.isActive ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-cyan-500/10 px-1.5 py-0.5 text-[10px] font-bold text-cyan-200 ring-1 ring-cyan-400/25">
                      Active
                    </span>
                  ) : null}
                  {e.isAuthenticated ? (
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold ring-1",
                        "text-emerald-200 ring-emerald-400/25",
                      )}
                    >
                      <ShieldCheck className="h-2.5 w-2.5" />
                      SIWE
                    </span>
                  ) : null}
                  {e.explorerHref ? (
                    <a
                      href={e.explorerHref}
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Open on explorer"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 transition hover:bg-white/[0.06] hover:text-zinc-100"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>

          <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] px-4 py-2.5 sm:px-5">
            <p className="flex items-center gap-1.5 text-[10.5px] text-zinc-500">
              <CheckCircle2 className="h-3 w-3 text-emerald-400/80" />
              {isConnected
                ? "All linked wallets share the same custodial identity."
                : "Connect a wallet to bind it to your identity."}
            </p>
            <ConnectButton.Custom>
              {({ openConnectModal, mounted }) =>
                mounted ? (
                  <button
                    type="button"
                    onClick={openConnectModal}
                    className="inline-flex items-center gap-1.5 rounded-md bg-white/[0.05] px-2 py-1 text-[10.5px] font-medium text-zinc-200 ring-1 ring-white/[0.06] transition hover:bg-white/[0.08]"
                  >
                    <Plus className="h-3 w-3" />
                    Add wallet
                  </button>
                ) : null
              }
            </ConnectButton.Custom>
          </footer>
        </>
      )}
    </motion.div>
  );
}

export const LinkedWalletsCard = memo(LinkedWalletsCardInner);
