"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { motion } from "framer-motion";
import {
  Briefcase,
  ChevronDown,
  Loader2,
  LogOut,
  Plus,
  Settings,
  Shield,
  User,
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
import { useShowAdminNavLink } from "@/widgets/admin-dashboard/hooks/use-admin-nav-session";

export function WalletPopover({
  connectLabel = "Connect Wallet",
  variant: _variant = "default",
}: {
  connectLabel?: string;
  variant?: "default" | "hub";
}) {
  const [open, setOpen] = useState(false);
  const { address, status } = useAccount();
  const { disconnectAsync, isPending: disconnectPending } = useDisconnect();
  const showAdminNav = useShowAdminNavLink();

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
              className="h-9 min-w-[7.5rem] animate-pulse rounded-lg border border-[var(--border)] bg-[color-mix(in_srgb,var(--foreground)_4%,transparent)]"
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
                "inline-flex h-9 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-md)] px-4 py-1.5 text-sm font-semibold transition-colors",
                "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/35",
                "disabled:cursor-not-allowed disabled:opacity-60",
              )}
            >
              {connecting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
                  <span>Connecting</span>
                </>
              ) : (
                <span>{connectLabel}</span>
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
              className="h-9 min-w-[7.5rem] animate-pulse rounded-[var(--radius-md)] border border-[var(--border)] bg-[color-mix(in_srgb,var(--foreground)_4%,transparent)]"
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
                  "inline-flex h-9 w-full shrink-0 items-center gap-1.5 rounded-[var(--radius-md)] border bg-[color-mix(in_srgb,var(--foreground)_3%,transparent)] px-2.5 pr-2.5 transition sm:w-auto",
                  wrongNetwork
                    ? "border-rose-500/35 bg-rose-500/[0.07]"
                    : "border-[var(--border)] hover:border-[var(--border-strong)] hover:bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)]",
                )}
              >
                <span className="size-2 shrink-0 rounded-full bg-emerald-400 ring-2 ring-emerald-400/25" aria-hidden />
                <span className="font-mono text-[11.5px] font-semibold tracking-tight text-chrome">
                  {display}
                </span>
                <ChevronDown className="h-3 w-3 shrink-0 text-chrome-muted" />
              </motion.button>
            </PopoverTrigger>

            <PopoverContent align="end" sideOffset={10} className="w-[220px] p-0">
              <div className="py-1">
                <Link
                  href={ROUTES.profile}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-[12px] text-chrome transition hover:bg-[color-mix(in_srgb,var(--foreground)_5%,transparent)]"
                >
                  <User className="h-3.5 w-3.5 text-chrome-muted" />
                  Profile
                </Link>
                <Link
                  href={ROUTES.portfolio}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-[12px] text-chrome transition hover:bg-[color-mix(in_srgb,var(--foreground)_5%,transparent)]"
                >
                  <Briefcase className="h-3.5 w-3.5 text-chrome-muted" />
                  Portfolio
                </Link>
                <Link
                  href={ROUTES.settings}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-[12px] text-chrome transition hover:bg-[color-mix(in_srgb,var(--foreground)_5%,transparent)]"
                >
                  <Settings className="h-3.5 w-3.5 text-chrome-muted" />
                  Settings
                </Link>
                <Link
                  href={ROUTES.marketCreate}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-[12px] text-chrome transition hover:bg-[color-mix(in_srgb,var(--foreground)_5%,transparent)]"
                >
                  <Plus className="h-3.5 w-3.5 text-emerald-400" />
                  Create market
                </Link>
                {showAdminNav ? (
                  <Link
                    href={ROUTES.adminDashboard}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-[12px] text-chrome transition hover:bg-[color-mix(in_srgb,var(--foreground)_5%,transparent)]"
                  >
                    <Shield className="h-3.5 w-3.5 text-chrome-muted" />
                    Operator console
                  </Link>
                ) : null}
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
