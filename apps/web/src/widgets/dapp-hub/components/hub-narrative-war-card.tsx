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
    <article className="hub-card flex flex-col gap-4 p-5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-[var(--hub-fg)]">{battle.label}</h3>
        <span className="font-mono text-xs text-[var(--hub-muted)]">
          Vol {fmtUsdCompact(battle.totalVolume24hUsd)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-center">
        <div>
          <p className="text-xs uppercase tracking-wider text-[var(--hub-muted)]">
            {battle.narrativeA}
          </p>
          <p className="mt-1 font-mono text-2xl font-semibold text-[var(--hub-success)]">
            {battle.probAPct}%
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-[var(--hub-muted)]">
            {battle.narrativeB}
          </p>
          <p className="mt-1 font-mono text-2xl font-semibold text-[var(--hub-attention)]">
            {battle.probBPct}%
          </p>
        </div>
      </div>

      <div className="flex h-2 overflow-hidden rounded-full bg-[var(--hub-border)]">
        <div
          className="h-full bg-[var(--hub-success)] transition-[width] duration-500 ease-out motion-reduce:transition-none"
          style={{ width: `${battle.probAPct}%` }}
        />
        <div
          className="h-full bg-[var(--hub-attention)] transition-[width] duration-500 ease-out motion-reduce:transition-none"
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
              className="inline-flex flex-1 items-center justify-center rounded-lg border border-[var(--hub-border)] px-3 py-2 text-sm font-medium text-[var(--hub-fg)] transition hover:border-[var(--hub-muted)]"
            >
              View Market
            </Link>
            <button
              type="button"
              onClick={() => {
                if (!battle.marketSlug) return;
                openTrade({
                  tradeMarketId: null,
                  slug: battle.marketSlug,
                  title: battle.marketTitle ?? battle.label,
                  category: "Narrative",
                  midYes: battle.probAPct / 100,
                  status: "OPEN",
                  closesAt: new Date().toISOString(),
                });
              }}
              className="inline-flex flex-1 items-center justify-center rounded-lg bg-[var(--hub-success)] px-3 py-2 text-sm font-semibold text-[#090909] transition hover:opacity-90"
            >
              Trade
            </button>
          </>
        ) : (
          <Link
            href={ROUTES.discover}
            className="inline-flex w-full items-center justify-center rounded-lg border border-[var(--hub-border)] px-3 py-2 text-sm font-medium text-[var(--hub-fg)]"
          >
            Browse Markets
          </Link>
        )}
      </div>
    </article>
  );
}
