"use client";

import type { Market } from "@orakly/types";
import { ExternalLink, Scale } from "lucide-react";
import { memo } from "react";
import { marketDetailPanelClass } from "./market-detail-section";

function pickResolutionSource(market: Market): { label: string; url?: string } {
  const meta = market.generationMeta;
  if (meta && typeof meta === "object") {
    const sourceUrl = typeof meta.sourceUrl === "string" ? meta.sourceUrl : undefined;
    const source =
      typeof meta.source === "string"
        ? meta.source
        : typeof meta.resolutionSource === "string"
          ? meta.resolutionSource
          : undefined;
    if (source) return { label: source, url: sourceUrl };
  }
  return { label: "Public sources at settlement" };
}

function MarketResolutionPanelInner({ market }: { market: Market }) {
  const rules = market.description?.trim() || market.title;

  const source = pickResolutionSource(market);
  const status = market.resolutionStatus ?? (market.status === "RESOLVED" ? "RESOLVED" : "OPEN");
  const reviewNote = market.resolutionReason?.trim();

  return (
    <section
      className={`${marketDetailPanelClass} p-3 sm:p-4`}
      aria-label="Resolution rules and source"
    >
      <div className="flex items-center gap-2 text-[12px] font-semibold text-[var(--md-fg)]">
        <Scale className="h-4 w-4 text-[var(--md-muted)]" aria-hidden />
        Resolution
        <span className="ml-auto rounded border border-[var(--md-border)] bg-[color-mix(in_srgb,var(--md-bg-subtle)_70%,transparent)] px-2 py-0.5 text-[10px] uppercase tracking-wide text-[var(--md-muted)]">
          {status}
        </span>
      </div>

      <div className="mt-3 space-y-2.5 text-[11px] leading-relaxed">
        <p className="whitespace-pre-wrap text-[13px] text-[var(--md-fg)]">{rules}</p>

        {reviewNote ? (
          <p className="rounded-md border border-[var(--md-border)] bg-[color-mix(in_srgb,var(--md-bg-subtle)_65%,transparent)] px-2.5 py-2 text-[var(--md-muted)]">
            <span className="font-semibold text-[var(--md-fg)]">Review: </span>
            {reviewNote}
          </p>
        ) : null}

        <p className="text-[var(--md-muted)]">
          <span className="font-semibold text-[var(--md-fg)]">Source: </span>
          {source.url ? (
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[var(--md-primary)] hover:underline"
            >
              {source.label}
              <ExternalLink className="h-3 w-3" aria-hidden />
            </a>
          ) : (
            <span className="text-[var(--md-fg)]">{source.label}</span>
          )}
        </p>

        {market.resolvedOutcome ? (
          <p>
            <span className="font-semibold text-[var(--md-muted)]">Outcome: </span>
            <span className="font-mono text-[var(--md-success)]">{market.resolvedOutcome}</span>
          </p>
        ) : null}
      </div>
    </section>
  );
}

export const MarketResolutionPanel = memo(MarketResolutionPanelInner);
