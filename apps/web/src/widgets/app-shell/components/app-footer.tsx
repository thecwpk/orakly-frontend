"use client";

import Image from "next/image";
import Link from "next/link";
import { BRAND_LOGO_MARK_DARK } from "@/shared/constants/brand-logos";
import { ROUTES } from "@/shared/constants/routes";

const footerLink =
  "block text-sm text-[var(--foreground-muted)] transition-colors hover:text-[var(--foreground)]";
const footerHeading =
  "mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--foreground-muted)]";

/**
 * Trust / navigation footer for the trading shell (Polymarket-style).
 */
export function AppFooter() {
  return (
    <footer className="mt-16 border-t border-[var(--border)] px-4 py-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 grid grid-cols-2 gap-8 md:grid-cols-5">
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
              <span className="font-bold text-[var(--foreground)]">Orakly</span>
            </div>
            <p className="text-xs leading-relaxed text-[var(--foreground-muted)]">
              Crypto attention intelligence. Trade on-chain prediction markets.
            </p>
            <div className="mt-4 flex gap-3">
              <a
                href="https://x.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--foreground-muted)] transition-colors hover:text-[var(--foreground)]"
              >
                𝕏
              </a>
              <a
                href="https://discord.gg"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--foreground-muted)] transition-colors hover:text-[var(--foreground)]"
              >
                Discord
              </a>
            </div>
          </div>

          <div>
            <p className={footerHeading}>Markets</p>
            <div className="space-y-2">
              <Link href={ROUTES.markets} className={footerLink}>
                All Markets
              </Link>
              <Link href={ROUTES.marketsTrending} className={footerLink}>
                Live Tape
              </Link>
              <Link href={ROUTES.narrativeWars} className={footerLink}>
                Narrative Wars
              </Link>
              <Link href={ROUTES.attention} className={footerLink}>
                Attention
              </Link>
            </div>
          </div>

          <div>
            <p className={footerHeading}>Community</p>
            <div className="space-y-2">
              <Link href={ROUTES.marketsCommunity} className={footerLink}>
                Community Markets
              </Link>
              <Link href={ROUTES.leaderboard} className={footerLink}>
                Leaderboard
              </Link>
              <Link href={ROUTES.activity} className={footerLink}>
                Activity Feed
              </Link>
              <Link href={ROUTES.narratives} className={footerLink}>
                Narratives
              </Link>
            </div>
          </div>

          <div>
            <p className={footerHeading}>Platform</p>
            <div className="space-y-2">
              <Link href={ROUTES.analytics} className={footerLink}>
                Analytics
              </Link>
              <Link href={ROUTES.portfolio} className={footerLink}>
                Portfolio
              </Link>
              <Link href={ROUTES.discover} className={footerLink}>
                Discover
              </Link>
              <Link href={ROUTES.settings} className={footerLink}>
                Settings
              </Link>
            </div>
          </div>

          <div>
            <p className={footerHeading}>Network</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-yellow-400" />
                <span className="text-sm text-[var(--foreground-muted)]">
                  BNB Chain
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
                <span className="text-sm text-[var(--foreground-muted)]">
                  Chain ID: 97
                </span>
              </div>
              <span className="mt-2 block text-xs text-[var(--foreground-muted)]">
                Auditable on-chain · Non-custodial
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-[var(--border)] pt-6 md:flex-row">
          <p className="text-xs text-[var(--foreground-muted)]">© 2026 Orakly</p>
          <p className="text-xs text-[var(--foreground-muted)]">
            Trading involves substantial risk of loss.
          </p>
        </div>
      </div>
    </footer>
  );
}
