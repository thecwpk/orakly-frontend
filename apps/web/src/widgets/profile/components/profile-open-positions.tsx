"use client";

import Link from "next/link";
import { Briefcase } from "lucide-react";
import { memo } from "react";
import { ROUTES } from "@/shared/constants/routes";
import { cn } from "@/lib/utils";
import { compactUsd } from "../lib/format";
import type { ProfilePositionRow } from "@/shared/contracts/trader-profile";

export type ProfileOpenPositionsProps = {
  positions: ReadonlyArray<ProfilePositionRow>;
};

function ProfileOpenPositionsInner({ positions }: ProfileOpenPositionsProps) {
  return (
    <section
      aria-label="Open positions"
      className="glass-panel-strong overflow-hidden rounded-2xl ring-1 ring-[var(--hub-border)]"
    >
      <header className="flex items-center gap-2 border-b border-[var(--hub-border)] px-4 py-3 sm:px-5">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-cyan-500/10 text-[var(--hub-primary-bright)] ring-1 ring-cyan-400/25">
          <Briefcase className="h-3.5 w-3.5" />
        </span>
        <div>
          <p className="text-[9.5px] font-bold uppercase tracking-[0.2em] text-[var(--hub-muted)]">
            Portfolio
          </p>
          <h2 className="text-[14px] font-semibold tracking-tight text-[var(--hub-fg)]">
            Open positions
          </h2>
        </div>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left text-[12.5px]">
          <thead>
            <tr className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--hub-muted)]">
              <th className="px-4 py-2 sm:px-5">Market</th>
              <th className="px-2 py-2">Side</th>
              <th className="px-2 py-2 text-right">Amount</th>
              <th className="px-2 py-2 text-right">Odds</th>
              <th className="px-4 py-2 pr-4 text-right sm:pr-5">Est. Payout</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--hub-border)]">
            {positions.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-[var(--hub-muted)] sm:px-5">
                  No open positions
                </td>
              </tr>
            ) : (
              positions.map((position) => (
                <tr key={`${position.marketId}-${position.side}`} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-2.5 sm:px-5">
                    <Link
                      href={ROUTES.market(position.marketSlug)}
                      className="line-clamp-2 font-medium text-[var(--hub-fg)] hover:text-[var(--hub-primary-bright)]"
                    >
                      {position.marketTitle}
                    </Link>
                  </td>
                  <td className="px-2 py-2.5">
                    <span
                      className={cn(
                        "rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase ring-1",
                        position.side === "YES"
                          ? "bg-cyan-500/10 text-cyan-200 ring-cyan-400/25"
                          : "bg-[var(--hub-primary-soft)] text-violet-200 ring-[var(--hub-border)]",
                      )}
                    >
                      {position.side}
                    </span>
                  </td>
                  <td className="px-2 py-2.5 text-right font-mono tabular-nums text-[var(--hub-fg)]">
                    {compactUsd(position.amountUsd)}
                  </td>
                  <td className="px-2 py-2.5 text-right font-mono tabular-nums text-[var(--hub-muted)]">
                    {position.oddsPct}%
                  </td>
                  <td className="px-4 py-2.5 pr-4 text-right font-mono tabular-nums text-[var(--hub-fg)] sm:pr-5">
                    {compactUsd(position.estPayoutUsd)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export const ProfileOpenPositions = memo(ProfileOpenPositionsInner);
