"use client";

import Link from "next/link";
import { ROUTES } from "@/shared/constants/routes";

export function HubPortfolioShortcut() {
  return (
    <section className="hub-section hub-section--mobile-reorder-portfolio lg:hidden">
      <Link
        href={ROUTES.portfolio}
        className="hub-card flex items-center justify-between px-4 py-4 transition hover:border-[var(--hub-success)]"
      >
        <div>
          <p className="text-sm font-semibold text-[var(--hub-fg)]">Your Portfolio</p>
          <p className="text-xs text-[var(--hub-muted)]">Positions, PnL, and trades</p>
        </div>
        <span className="text-sm font-medium text-[var(--hub-success)]">Open →</span>
      </Link>
    </section>
  );
}
