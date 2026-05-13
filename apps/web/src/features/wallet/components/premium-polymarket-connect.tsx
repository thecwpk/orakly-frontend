"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  Loader2,
  LogOut,
  RadioTower,
  Wallet,
} from "lucide-react";
import { useAccount, useDisconnect } from "wagmi";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const glassPanel =
  "border border-white/[0.09] bg-white/[0.05] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] backdrop-blur-xl";

function truncateAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function EnsAvatar({ src }: { src: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- ENS / wallet avatar URLs are third-party dynamic hosts
    <img
      src={src}
      alt=""
      width={32}
      height={32}
      className="h-8 w-8 rounded-full object-cover ring-2 ring-white/15"
    />
  );
}

export type PremiumPolymarketConnectProps = {
  className?: string;
  /** Stretch to container width below `sm` (nav drawers). */
  fullWidthMobile?: boolean;
};

export function PremiumPolymarketConnect({
  className,
  fullWidthMobile = true,
}: PremiumPolymarketConnectProps) {
  const { status } = useAccount();
  const { disconnectAsync, isPending: disconnectPending } = useDisconnect();

  const isConnecting =
    status === "connecting" || status === "reconnecting";

  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        mounted,
        authenticationStatus,
        openConnectModal,
        openAccountModal,
        openChainModal,
      }) => {
        const ready = mounted;
        const connected = Boolean(ready && account);

        const primaryLabel =
          account?.ensName ?? (account ? truncateAddress(account.address) : "");
        const secondaryLabel =
          account?.ensName ? truncateAddress(account.address) : null;

        const pendingTx = account?.hasPendingTransactions ?? false;
        const authLoading = authenticationStatus === "loading";

        return (
          <div
            className={cn(
              "relative flex items-center gap-1.5 sm:gap-2",
              fullWidthMobile && "w-full min-[420px]:w-auto",
              className,
            )}
          >
            <AnimatePresence mode="wait" initial={false}>
              {!ready ?
                <motion.div
                  key="hydrate"
                  role="status"
                  aria-label="Loading wallet"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    "flex h-10 items-center gap-2 rounded-2xl px-3 sm:h-11 sm:px-4",
                    glassPanel,
                    fullWidthMobile && "w-full min-[420px]:w-[11.5rem]",
                  )}
                >
                  <span className="h-7 w-7 shrink-0 animate-pulse rounded-full bg-white/10" />
                  <span className="h-2.5 flex-1 rounded-full bg-white/10" />
                </motion.div>
              : !connected ?
                <motion.button
                  key="connect"
                  type="button"
                  disabled={isConnecting}
                  onClick={openConnectModal}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ type: "spring", stiffness: 420, damping: 32 }}
                  whileHover={{ scale: isConnecting ? 1 : 1.02 }}
                  whileTap={{ scale: isConnecting ? 1 : 0.98 }}
                  className={cn(
                    "relative isolate inline-flex h-10 min-h-10 items-center justify-center gap-2 overflow-hidden rounded-2xl px-4 text-[13px] font-semibold tracking-tight text-zinc-950 sm:h-11 sm:min-h-[2.75rem] sm:px-5 sm:text-sm",
                    "bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 shadow-[0_0_0_1px_rgba(255,255,255,0.12)_inset,0_8px_28px_-8px_rgba(34,211,238,0.45)]",
                    "disabled:cursor-not-allowed disabled:opacity-70",
                    fullWidthMobile && "w-full min-[420px]:w-auto",
                  )}
                >
                  <span
                    className="pointer-events-none absolute inset-0 bg-[linear-gradient(105deg,rgba(255,255,255,0.35)_0%,transparent_45%)] opacity-40"
                    aria-hidden
                  />
                  {isConnecting ?
                    <>
                      <Loader2 className="relative z-10 h-4 w-4 animate-spin" />
                      <span className="relative z-10">Connecting…</span>
                    </>
                  : <>
                      <Wallet className="relative z-10 h-4 w-4 opacity-90" />
                      <span className="relative z-10">Connect wallet</span>
                    </>
                  }
                </motion.button>
              : account ?
                <motion.div
                  key="connected"
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  className={cn(
                    "flex min-w-0 flex-1 flex-wrap items-center justify-end gap-1.5 sm:flex-nowrap sm:gap-2",
                    fullWidthMobile && "w-full min-[420px]:w-auto",
                  )}
                >
                  <motion.button
                    type="button"
                    layout
                    onClick={openChainModal}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "inline-flex max-w-full shrink-0 items-center gap-1.5 rounded-2xl px-2.5 py-2 text-left sm:px-3 sm:py-2",
                      glassPanel,
                      chain?.unsupported ?
                        "border-rose-500/35 bg-rose-500/[0.07] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]"
                      : "",
                    )}
                  >
                    {chain?.hasIcon && chain.iconUrl ?
                      <span className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full ring-1 ring-white/15">
                        {/* eslint-disable-next-line @next/next/no-img-element -- dynamic wallet-provided icon URLs */}
                        <img
                          src={chain.iconUrl}
                          alt=""
                          width={24}
                          height={24}
                          className="h-full w-full object-cover"
                        />
                      </span>
                    : <RadioTower className="h-4 w-4 shrink-0 text-cyan-300/90" />}
                    <span className="hidden min-w-0 truncate text-[11px] font-semibold uppercase tracking-wide text-zinc-200 min-[380px]:inline sm:text-[12px]">
                      {chain?.unsupported ? "Unsupported" : (chain?.name ?? "Network")}
                    </span>
                  </motion.button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <motion.button
                        type="button"
                        layout
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className={cn(
                          "inline-flex min-h-10 min-w-0 flex-1 items-center gap-2 rounded-2xl py-2 pr-2 pl-2.5 text-left sm:min-h-11 sm:gap-2.5 sm:pr-3 sm:pl-3",
                          glassPanel,
                          fullWidthMobile && "w-full min-[420px]:w-auto",
                        )}
                      >
                        <span className="relative shrink-0">
                          {account.ensAvatar ?
                            <EnsAvatar src={account.ensAvatar} />
                          : <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/35 via-teal-500/25 to-cyan-500/35 font-mono text-[11px] font-semibold uppercase text-white ring-2 ring-white/15">
                              {account.address.slice(2, 4)}
                            </span>
                          }
                          <AnimatePresence>
                            {pendingTx ?
                              <>
                                <motion.span
                                  layoutId="pending-ring"
                                  initial={{ scale: 0.6, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  exit={{ scale: 0.6, opacity: 0 }}
                                  className="pointer-events-none absolute -inset-0.5 rounded-full border-2 border-amber-400/70"
                                  aria-hidden
                                />
                                <motion.span
                                  className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-zinc-950 shadow-lg shadow-amber-500/40 ring-2 ring-[#050508]"
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  exit={{ scale: 0 }}
                                  aria-label="Pending transactions"
                                >
                                  <Loader2 className="h-2.5 w-2.5 animate-spin" />
                                </motion.span>
                              </>
                            : null}
                          </AnimatePresence>
                        </span>

                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className="truncate font-medium tracking-tight text-white">
                              {primaryLabel}
                            </span>
                            {authLoading ?
                              <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-zinc-400" />
                            : null}
                          </span>
                          {secondaryLabel ?
                            <span className="mt-0.5 block truncate font-mono text-[11px] text-zinc-500">
                              {secondaryLabel}
                            </span>
                          : null}
                          {authenticationStatus === "unauthenticated" ?
                            <span className="mt-1 block text-[10px] font-medium text-amber-200/90">
                              Sign message to authenticate
                            </span>
                          : null}
                        </span>

                        <ChevronDown className="h-4 w-4 shrink-0 text-zinc-500" />
                      </motion.button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      sideOffset={8}
                      className={cn(
                        "min-w-[13rem] rounded-2xl border border-white/10 bg-[#09090d]/95 p-1.5 text-zinc-100 backdrop-blur-2xl",
                        "shadow-[0_24px_48px_-12px_rgba(0,0,0,0.65)]",
                      )}
                    >
                      <DropdownMenuItem
                        className="cursor-pointer rounded-xl focus:bg-white/[0.07]"
                        onSelect={() => openAccountModal()}
                      >
                        <Wallet className="text-cyan-300/90" />
                        Wallet & balances
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="cursor-pointer rounded-xl focus:bg-white/[0.07]"
                        onSelect={() => openChainModal()}
                      >
                        <RadioTower className="text-emerald-300/90" />
                        Switch network
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-white/10" />
                      <DropdownMenuItem
                        variant="destructive"
                        disabled={disconnectPending}
                        className="cursor-pointer rounded-xl focus:bg-rose-500/15"
                        onSelect={() => void disconnectAsync()}
                      >
                        {disconnectPending ?
                          <Loader2 className="animate-spin" />
                        : <LogOut />}
                        Disconnect
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </motion.div>
              : null}
            </AnimatePresence>
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
