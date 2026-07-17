"use client";

import Image from "next/image";
import Link from "next/link";
import { BRAND_LOGO_MARK_DARK } from "@/shared/constants/brand-logos";
import { ROUTES } from "@/shared/constants/routes";

/**
 * Trust / navigation footer for the trading shell (Polymarket-style).
 */
export function AppFooter() {
  return (
    <footer className="mt-16 border-t border-white/5 px-4 py-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <div className="mb-3 flex items-center gap-2">
              <Image
                src={BRAND_LOGO_MARK_DARK}
                alt="Orakly"
                width={24}
                height={24}
                unoptimized
                className="h-6 w-6 object-contain"
              />
              <span className="font-bold text-white">Orakly</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-500">
              Crypto attention intelligence. Trade on-chain prediction markets.
            </p>
            <div className="mt-4 flex gap-3">
              <a
                href="https://x.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-500 transition-colors hover:text-white"
              >
                𝕏
              </a>
              <a
                href="https://discord.gg"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-500 transition-colors hover:text-white"
              >
                Discord
              </a>
            </div>
          </div>

          {/* Markets */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
              Markets
            </p>
            <div className="space-y-2">
              <Link
                href={ROUTES.markets}
                className="block text-sm text-slate-500 transition-colors hover:text-white"
              >
                All Markets
              </Link>
              <Link
                href={ROUTES.marketsCommunity}
                className="block text-sm text-slate-500 transition-colors hover:text-white"
              >
                Community
              </Link>
              <Link
                href={ROUTES.narrativeWars}
                className="block text-sm text-slate-500 transition-colors hover:text-white"
              >
                Narrative Wars
              </Link>
              <Link
                href={ROUTES.attention}
                className="block text-sm text-slate-500 transition-colors hover:text-white"
              >
                Narratives
              </Link>
            </div>
          </div>

          {/* Platform */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
              Platform
            </p>
            <div className="space-y-2">
              <Link
                href={ROUTES.leaderboard}
                className="block text-sm text-slate-500 transition-colors hover:text-white"
              >
                Leaderboard
              </Link>
              <Link
                href={ROUTES.analytics}
                className="block text-sm text-slate-500 transition-colors hover:text-white"
              >
                Analytics
              </Link>
              <Link
                href={ROUTES.portfolio}
                className="block text-sm text-slate-500 transition-colors hover:text-white"
              >
                Portfolio
              </Link>
            </div>
          </div>

          {/* Network */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
              Network
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-yellow-400" />
                <span className="text-sm text-slate-500">BNB Testnet</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
                <span className="text-sm text-slate-500">Chain ID: 97</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-6 md:flex-row">
          <p className="text-xs text-slate-600">© 2026 Orakly</p>
          <p className="text-xs text-slate-600">
            Trading involves substantial risk of loss.
          </p>
        </div>
      </div>
    </footer>
  );
}
