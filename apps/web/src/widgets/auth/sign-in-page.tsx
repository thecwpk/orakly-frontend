"use client";

import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Sparkles, Zap } from "lucide-react";
import Link from "next/link";
import { useHydrationSafeReducedMotion } from "@/lib/use-hydration-safe-reduced-motion";
import { ROUTES } from "@/shared/constants/routes";
import { PremiumPolymarketConnect } from "@/features/wallet/components/premium-polymarket-connect";

const HIGHLIGHTS = [
  { icon: ShieldCheck, label: "Custodial · audited flows" },
  { icon: Zap, label: "Realtime matching engine" },
  { icon: Sparkles, label: "Optimistic order confirmation" },
];

export function SignInPage() {
  const reduceMotion = useHydrationSafeReducedMotion();

  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass-panel-strong neon-edge-cyan relative w-full max-w-md overflow-hidden rounded-2xl p-r24 sm:p-s48"
    >
      <div className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full bg-cyan-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -left-12 -bottom-16 h-40 w-40 rounded-full bg-violet-500/20 blur-3xl" />

      <div className="relative">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-400/90">
          Sign in
        </p>
        <h1 className="mt-2 text-balance text-2xl font-semibold leading-tight tracking-tight text-white sm:text-[1.65rem]">
          Connect a wallet to start trading.
        </h1>
        <p className="mt-3 text-[13.5px] leading-relaxed text-zinc-400">
          Orakly uses your wallet for identity. Sign once to enable protected
          routes — no email, no password, no tracking.
        </p>

        <div className="mt-6 space-y-2.5">
          <PremiumPolymarketConnect className="w-full" />
          <Link
            href={ROUTES.blockchainConnect}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-white/[0.05] px-4 py-3 text-[13px] font-medium text-zinc-200 ring-1 ring-white/10 transition hover:bg-white/[0.1]"
          >
            Use another connector
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <ul className="mt-6 space-y-2 border-t border-white/[0.06] pt-5">
          {HIGHLIGHTS.map(({ icon: Icon, label }) => (
            <li
              key={label}
              className="flex items-center gap-2 text-[12px] text-zinc-500"
            >
              <Icon className="h-3.5 w-3.5 text-cyan-400/80" />
              {label}
            </li>
          ))}
        </ul>

        <p className="mt-6 text-center text-[11px] text-zinc-600">
          Already authenticated?{" "}
          <Link
            href={ROUTES.portfolio}
            className="font-medium text-zinc-400 underline-offset-4 hover:underline"
          >
            Open portfolio
          </Link>
        </p>
      </div>
    </motion.section>
  );
}
