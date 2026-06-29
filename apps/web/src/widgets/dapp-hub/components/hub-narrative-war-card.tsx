"use client";

import Link from "next/link";
import { useOpenTradeModal } from "@/features/trading";
import { ROUTES } from "@/shared/constants/routes";
import type { NarrativeWarCard } from "@/shared/contracts/hub-home";
import { cn } from "@/lib/utils";
import { fmtMomentum, fmtUsdCompact } from "../lib/format-hub-metrics";

export function HubNarrativeWarCard({ battle }: { battle: NarrativeWarCard }) {
  const openTrade = useOpenTradeModal();

  return (
    <article className="hub-card flex flex-col gap-4 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-[var(--hub-fg)] sm:text-base">{battle.label}</h3>
        <span className="font-mono text-xs text-[var(--hub-muted)]">
          {fmtUsdCompact(battle.totalVolume24hUsd)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-center">
        <div className="rounded-lg bg-[var(--hub-primary-soft)] px-2 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--hub-muted)]">
            {battle.narrativeA}
          </p>
          <p className="mt-1 font-mono text-xl font-bold text-[var(--hub-primary-bright)] sm:text-2xl">
            {battle.probAPct}%
          </p>
        </div>
        <div className="rounded-lg bg-[rgba(56,189,248,0.1)] px-2 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--hub-muted)]">
            {battle.narrativeB}
          </p>
          <p className="mt-1 font-mono text-xl font-bold text-[#7dd3fc] sm:text-2xl">
            {battle.probBPct}%
          </p>
        </div>
      </div>

      <div className="flex h-2 overflow-hidden rounded-full bg-[var(--hub-border)]">
        <div
          className="h-full bg-[var(--hub-primary)] transition-[width] duration-500 ease-out motion-reduce:transition-none"
          style={{ width: `${battle.probAPct}%` }}
        />
        <div
          className="h-full bg-[#38bdf8] transition-[width] duration-500 ease-out motion-reduce:transition-none"
          style={{ width: `${battle.probBPct}%` }}
        />
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-[var(--hub-muted)]">
        <span>
          Conviction{" "}
          <strong className="text-[var(--hub-fg)]">{Math.round(battle.conviction)}</strong>
        </span>
        <span>
          Momentum{" "}
          <strong
            className={cn(
              battle.momentumPct >= 0 ? "text-[var(--hub-success)]" : "text-[var(--hub-danger)]",
            )}
          >
            {fmtMomentum(battle.momentumPct)}
          </strong>
        </span>
      </div>

      <div className="mt-auto flex gap-2">
        {battle.marketSlug ? (
          <>
            <Link
              href={ROUTES.market(battle.marketSlug)}
              className="hub-btn-secondary flex-1 py-2 text-sm"
            >
              View
            </Link>
            <button
              type="button"
              onClick={() => {
                if (!battle.marketSlug) return;
                openTrade({
                  tradeMarketId: null,
                  onChainAddress: null,
                  chainId: null,
                  slug: battle.marketSlug,
                  title: battle.marketTitle ?? battle.label,
                  category: "Narrative",
                  midYes: battle.probAPct / 100,
                  status: "OPEN",
                  closesAt: new Date().toISOString(),
                });
              }}
              className="hub-btn-primary flex-1 py-2 text-sm"
            >
              Trade
            </button>
          </>
        ) : (
          <Link href={ROUTES.discover} className="hub-btn-secondary w-full py-2 text-sm">
            Browse markets
          </Link>
        )}
      </div>
    </article>
  );
}
