"use client";

import Link from "next/link";
import { Layers } from "lucide-react";

import { ROUTES } from "@/shared/constants/routes";
import { BrandWordmarkLink } from "@/shared/ui";
import { cn } from "@/lib/utils";
import {
  landingBandInner,
  landingEyebrow,
  landingSectionBand,
} from "@/widgets/landing/sections/marketing-landing-rail";

const PRODUCT_LINKS = [
  { label: "Markets", href: ROUTES.discover, external: false },
  { label: "Launch app", href: ROUTES.dapp, external: false },
  { label: "How it works", href: "#how-it-works", external: true },
  { label: "Roadmap", href: "#roadmap", external: true },
  { label: "FAQ", href: "#faq", external: true },
] as const;

const COMMUNITY_LINKS = [
  { label: "X / Twitter", href: "#" },
  { label: "Telegram", href: "#" },
  { label: "Discord", href: "#" },
  { label: "Email updates", href: "#early-access" },
] as const;

const SITEMAP_LINKS = [
  { label: "Live markets", href: "#live-markets" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Why Orakly", href: "#why" },
  { label: "Trust", href: "#trust" },
  { label: "Roadmap", href: "#roadmap" },
  { label: "FAQ", href: "#faq" },
] as const;

const NEW_TAB = { target: "_blank" as const, rel: "noopener noreferrer" as const };

const footerLinkClass =
  "marketing-footer-link text-sm text-slate-300/90 transition-colors duration-200 hover:text-sky-200";

/**
 * Exchange-style footer — blue-slate canvas, nav lockup, dense link columns.
 */
export function MarketingLandingFooter() {
  return (
    <footer
      id="footer"
      className={cn(landingSectionBand, "marketing-footer-shell scroll-mt-28")}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/25 to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(ellipse_80%_100%_at_50%_0%,oklch(0.32_0.08_220_/_0.2),transparent_70%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(125,211,252,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(125,211,252,0.035)_1px,transparent_1px)] [background-size:48px_48px]"
        aria-hidden
      />

      <div className={cn(landingBandInner, "relative")}>
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          <div className="sm:col-span-2 lg:col-span-5">
            <BrandWordmarkLink href={ROUTES.home} showTitle variant="nav" className="shrink-0" openInNewTab />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-400">
              On-chain prediction markets across crypto, macro, sports, and tech. Transparent rules, stablecoin rails,
              settlement you can verify.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/20 bg-sky-500/[0.07] px-3 py-1 text-[11px] font-medium text-sky-200/90">
                <Layers className="size-3.5 shrink-0 opacity-80" aria-hidden />
                Multi-network
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Stablecoin-native
              </span>
            </div>
          </div>

          <div className="lg:col-span-3">
            <p className={cn(landingEyebrow, "text-sky-400/50")}>Product</p>
            <nav className="mt-4 flex flex-col gap-2" aria-label="Footer product">
              {PRODUCT_LINKS.map((item) =>
                item.external ? (
                  <a key={item.label} href={item.href} className={footerLinkClass} {...NEW_TAB}>
                    {item.label}
                  </a>
                ) : (
                  <Link key={item.label} href={item.href} className={footerLinkClass} {...NEW_TAB}>
                    {item.label}
                  </Link>
                ),
              )}
            </nav>
          </div>

          <div className="lg:col-span-4">
            <p className={cn(landingEyebrow, "text-violet-300/45")}>Community</p>
            <nav className="mt-4 flex flex-col gap-2" aria-label="Footer social">
              {COMMUNITY_LINKS.map((item) => (
                <a key={item.label} href={item.href} className={footerLinkClass} {...NEW_TAB}>
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        </div>

        <div className="marketing-footer-bar relative mt-10 flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} Orakly Market. All rights reserved.
          </p>
          <nav className="flex flex-wrap gap-1.5 sm:justify-end" aria-label="Sitemap">
            {SITEMAP_LINKS.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="marketing-footer-pill rounded-full px-2.5 py-1 text-[11px] text-slate-400 transition hover:text-sky-200"
                {...NEW_TAB}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
