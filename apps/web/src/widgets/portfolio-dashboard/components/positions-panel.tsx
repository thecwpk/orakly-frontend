"use client";

import type { PortfolioSnapshot } from "@/shared/api/fetchers/portfolio";
import { formatCompactUsd } from "@orakly/utils";
import { motion } from "framer-motion";
import Link from "next/link";
import { memo, useMemo } from "react";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/shared/constants/routes";
import {
  parseUsd,
  positionMarkPrice,
  positionProbDeltaCents,
  positionYesMidPct,
} from "../lib/portfolio-metrics";

function fmtDeltaCents(d: number | null): string {
  if (d == null || !Number.isFinite(d)) return "—";
  const r = Math.round(d * 10) / 10;
  if (r === 0) return "0";
  return `${r > 0 ? "+" : ""}${r}¢`;
}

function PositionsPanelInner({
  positions,
  feedRevision = 0,
}: {
  positions: PortfolioSnapshot["positions"];
  /** Tick when portfolio refetches — subtle motion on marks / PnL. */
  feedRevision?: number;
}) {
  const revisionKey = useMemo(() => String(feedRevision), [feedRevision]);

  if (!positions.length) {
    return (
      <div className="surface-terminal-solid rounded-md px-r24 py-s48 text-center">
        <p className="font-mono text-[11px] font-medium tabular-nums text-[var(--hub-muted)]">No open legs</p>
        <p className="mt-r8 font-mono text-[10px] text-[var(--hub-muted)]">
          Size routes from Markets · fills sync here
        </p>
        <Link
          href={ROUTES.discover}
          prefetch
          className="mt-r24 inline-flex rounded-[3px] bg-white/[0.06] px-r16 py-r8 font-mono text-[10px] font-semibold uppercase tracking-wide text-[var(--hub-fg)] transition hover:bg-[var(--hub-card-hover)]"
        >
          Markets
        </Link>
      </div>
    );
  }

  return (
    <div className="surface-terminal-solid overflow-hidden rounded-md">
      <div className="flex flex-wrap items-end justify-between gap-r16 border-b border-[var(--hub-border)] px-r16 py-r16 sm:px-r20">
        <div>
          <p className="label-terminal">Positions</p>
          <p className="mt-r4 font-mono text-[11px] font-medium tabular-nums text-[var(--hub-fg)]">
            {positions.length} leg{positions.length === 1 ? "" : "s"}
          </p>
        </div>
        <p className="font-mono text-[9px] text-[var(--hub-muted)]">
          Δ = mark − avg (¢)
        </p>
      </div>

      <div className="scrollbar-terminal max-h-[min(52vh,420px)] overflow-auto overscroll-contain">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <thead className="sticky top-0 z-[1] bg-[#06060b]/98 backdrop-blur-sm">
            <tr className="text-[8.5px] font-semibold uppercase tracking-[0.12em] text-[var(--hub-muted)]">
              <th className="whitespace-nowrap px-3 py-2 font-medium sm:px-3.5">Market</th>
              <th className="whitespace-nowrap px-2 py-2 font-medium">Side</th>
              <th className="whitespace-nowrap px-2 py-2 text-right font-medium">Qty</th>
              <th className="whitespace-nowrap px-2 py-2 text-right font-medium">Avg</th>
              <th className="whitespace-nowrap px-2 py-2 text-right font-medium">Mark</th>
              <th className="whitespace-nowrap px-2 py-2 text-right font-medium">YES</th>
              <th className="whitespace-nowrap px-2 py-2 text-right font-medium">Δ¢</th>
              <th className="whitespace-nowrap px-3 py-2 text-right font-medium sm:px-3.5">uPnL</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {positions.map((p) => {
              const qty = parseUsd(p.quantity);
              const entry = parseUsd(p.avgEntryPrice);
              const mark = positionMarkPrice(p);
              const uPnL = qty * (mark - entry);
              const up = uPnL >= 0;
              const dCents = positionProbDeltaCents(p);
              const yesMid = positionYesMidPct(p);

              return (
                <tr key={`${p.marketId}-${p.side}`} className="font-mono text-[11px] text-[var(--hub-muted)]">
                  <td className="max-w-[220px] px-3 py-1.5 sm:max-w-[280px] sm:px-3.5 sm:py-2">
                    <Link
                      href={ROUTES.market(p.market.slug)}
                      className="line-clamp-2 text-[11px] font-sans font-medium leading-snug text-[var(--hub-fg)] transition hover:text-[var(--hub-primary-bright)]/95"
                    >
                      {p.market.title}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-2 py-1.5 sm:py-2">
                    <span
                      className={cn(
                        "inline-flex rounded px-1.5 py-px text-[9.5px] font-bold ring-1",
                        p.side === "YES"
                          ? "bg-[var(--hub-primary-soft)] text-cyan-200 ring-cyan-500/22"
                          : "bg-[var(--hub-primary-soft)] text-violet-200 ring-violet-500/22",
                      )}
                    >
                      {p.side}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-2 py-1.5 text-right tabular-nums sm:py-2">
                    {qty.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </td>
                  <td className="whitespace-nowrap px-2 py-1.5 text-right tabular-nums text-[var(--hub-muted)] sm:py-2">
                    {(entry * 100).toFixed(1)}¢
                  </td>
                  <td className="whitespace-nowrap px-2 py-1.5 text-right sm:py-2">
                    <motion.span
                      key={`${revisionKey}-mk-${p.marketId}-${mark}`}
                      initial={{ opacity: 0.65 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                      className="tabular-nums text-[var(--hub-fg)]"
                    >
                      {(mark * 100).toFixed(1)}¢
                    </motion.span>
                  </td>
                  <td className="whitespace-nowrap px-2 py-1.5 text-right tabular-nums text-[var(--hub-muted)] sm:py-2">
                    {yesMid != null ? `${yesMid}%` : "—"}
                  </td>
                  <td
                    className={cn(
                      "whitespace-nowrap px-2 py-1.5 text-right tabular-nums sm:py-2",
                      dCents != null && dCents > 0 && "text-emerald-400/95",
                      dCents != null && dCents < 0 && "text-rose-400/90",
                      (dCents == null || dCents === 0) && "text-[var(--hub-muted)]",
                    )}
                  >
                    <motion.span
                      key={`${revisionKey}-d-${p.marketId}-${dCents ?? "x"}`}
                      initial={{ opacity: 0.6 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.18 }}
                    >
                      {fmtDeltaCents(dCents)}
                    </motion.span>
                  </td>
                  <td
                    className={cn(
                      "whitespace-nowrap px-3 py-1.5 text-right text-[11px] font-semibold tabular-nums sm:px-3.5 sm:py-2",
                      up ? "text-emerald-400/95" : "text-rose-400/95",
                    )}
                  >
                    <motion.span
                      key={`${revisionKey}-u-${p.marketId}-${uPnL}`}
                      initial={{ opacity: 0.65 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      {up ? "+" : ""}
                      {formatCompactUsd(uPnL)}
                    </motion.span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export const PositionsPanel = memo(PositionsPanelInner);
