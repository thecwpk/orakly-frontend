"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { motion } from "framer-motion";
import {
  Briefcase,
  ChevronDown,
  Loader2,
  LogOut,
  Settings,
  User,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useAccount, useDisconnect } from "wagmi";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ROUTES } from "@/shared/constants/routes";
import { cn } from "@/lib/utils";

export function WalletPopover({
  connectLabel = "Connect Wallet",
  variant = "default",
}: {
  connectLabel?: string;
  variant?: "default" | "hub";
}) {
  const [open, setOpen] = useState(false);
  const { address, status } = useAccount();
  const { disconnectAsync, isPending: disconnectPending } = useDisconnect();

  const connecting = status === "connecting" || status === "reconnecting";
  const connected = status === "connected" && Boolean(address);

  return (
    <ConnectButton.Custom>
      {({ account, chain, mounted, openConnectModal }) => {
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
          return (
            <motion.button
              type="button"
              disabled={connecting}
              onClick={openConnectModal}
              whileHover={connecting ? undefined : { scale: 1.01 }}
              whileTap={connecting ? undefined : { scale: 0.99 }}
              className={cn(
                "inline-flex h-9 w-full shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 text-sm font-semibold transition-colors",
                "border border-[#2563eb] bg-[#2563eb] text-white hover:bg-[#1d4ed8]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb]/35",
                "disabled:cursor-not-allowed disabled:opacity-60",
                variant === "default" && "sm:w-auto",
              )}
            >
              {connecting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
                  <span>Connecting</span>
                </>
              ) : (
                <>
                  <Wallet className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
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
              className="h-9 min-w-[7.5rem] animate-pulse rounded-[10px] border border-white/[0.06] bg-white/[0.04]"
            />
          );
        }
        const display = `${addr.slice(0, 6)}...${addr.slice(-4)}`;

        return (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <motion.button
                type="button"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className={cn(
                  "inline-flex h-9 w-full shrink-0 items-center gap-1.5 rounded-[10px] border bg-white/[0.03] px-2.5 pr-2.5 transition sm:w-auto",
                  wrongNetwork
                    ? "border-rose-500/35 bg-rose-500/[0.07]"
                    : "border-white/[0.08] hover:border-white/[0.11] hover:bg-white/[0.06]",
                )}
              >
                <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-white/[0.06] font-mono text-[9px] font-semibold uppercase tracking-tight text-emerald-300/95 ring-1 ring-white/[0.08]">
                  {addr.slice(2, 4)}
                </span>
                <span className="font-mono text-[11.5px] font-semibold tracking-tight text-zinc-100">
                  {display}
                </span>
                <ChevronDown className="h-3 w-3 shrink-0 text-zinc-500" />
              </motion.button>
            </PopoverTrigger>

            <PopoverContent align="end" sideOffset={10} className="w-[220px] p-0">
              <div className="py-1">
                <Link
                  href={ROUTES.profile}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-[12px] text-zinc-200 transition hover:bg-white/[0.04]"
                >
                  <User className="h-3.5 w-3.5 text-zinc-400" />
                  Profile
                </Link>
                <Link
                  href={ROUTES.portfolio}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-[12px] text-zinc-200 transition hover:bg-white/[0.04]"
                >
                  <Briefcase className="h-3.5 w-3.5 text-zinc-400" />
                  Portfolio
                </Link>
                <Link
                  href={ROUTES.settings}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-[12px] text-zinc-200 transition hover:bg-white/[0.04]"
                >
                  <Settings className="h-3.5 w-3.5 text-zinc-400" />
                  Settings
                </Link>
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
