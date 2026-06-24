"use client";

import type { Market } from "@orakly/types";
import { Flame } from "lucide-react";
import Link from "next/link";
import { ROUTES } from "@/shared/constants/routes";
import { cn } from "@/lib/utils";

function fmtVol(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "—";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 10_000) return `$${(n / 1_000).toFixed(1)}k`;
  return `$${Math.round(n)}`;
}

export function MarketsHotNarrativesRail({ markets }: { markets: Market[] }) {
  if (!markets.length) return null;

  return (
    <section className="rounded-lg border border-[var(--hub-border)] bg-[var(--hub-bg-subtle)] px-2 py-2">
      <div className="mb-1 flex items-center justify-between gap-2 px-0.5">
        <div className="flex min-w-0 items-center gap-1.5">
          <Flame className="h-3 w-3 shrink-0 text-[var(--hub-primary-bright)]" aria-hidden />
          <span className="truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--hub-muted)]">
            Hot narratives
          </span>
        </div>
      </div>
      <div className="flex gap-1 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:thin] snap-x">
        {markets.map((m) => (
          <Link
            key={m.id}
            href={ROUTES.market(m.slug)}
            prefetch
            className={cn(
              "max-w-[min(260px,72vw)] shrink-0 snap-start rounded-md bg-[var(--hub-card)] py-1 pl-2 pr-2",
              "ring-1 ring-[var(--hub-border)] transition hover:bg-[var(--hub-card-hover)] hover:ring-[var(--hub-border-strong)]",
            )}
          >
            <p className="truncate text-[11px] font-medium leading-tight text-[var(--hub-fg)]">{m.title}</p>
            <div className="mt-0.5 flex items-center gap-2 font-mono text-[9px] tabular-nums text-[var(--hub-muted)]">
              <span className="text-[var(--hub-primary-bright)]">{Math.round(m.probability * 100)}¢</span>
              <span>{fmtVol(m.volumeUsd ?? 0)}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
