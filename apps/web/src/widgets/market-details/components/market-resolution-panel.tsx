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
  if (market.resolutionReason?.trim()) {
    return { label: market.resolutionReason.trim() };
  }
  return { label: "Public sources at settlement" };
}

function MarketResolutionPanelInner({ market }: { market: Market }) {
  const rules =
    market.description?.trim() ||
    `YES if the stated event occurs before close. NO if it does not. Market: ${market.title}`;

  const source = pickResolutionSource(market);
  const status = market.resolutionStatus ?? (market.status === "RESOLVED" ? "RESOLVED" : "OPEN");

  return (
    <section
      className={`${marketDetailPanelClass} p-3 sm:p-4`}
      aria-label="Resolution rules and source"
    >
      <div className="flex items-center gap-2 text-[12px] font-semibold text-zinc-200">
        <Scale className="h-4 w-4 text-zinc-500" aria-hidden />
        Resolution
        <span className="ml-auto rounded border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-zinc-500">
          {status}
        </span>
      </div>

      <div className="mt-3 space-y-2 text-[11px] leading-relaxed text-zinc-400">
        <p className="whitespace-pre-wrap text-zinc-300">{rules}</p>
        <p>
          <span className="font-semibold text-zinc-500">Source: </span>
          {source.url ? (
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-cyan-300/90 hover:underline"
            >
              {source.label}
              <ExternalLink className="h-3 w-3" aria-hidden />
            </a>
          ) : (
            <span className="text-zinc-300">{source.label}</span>
          )}
        </p>
        {market.resolvedOutcome ? (
          <p>
            <span className="font-semibold text-zinc-500">Outcome: </span>
            <span className="font-mono text-emerald-300">{market.resolvedOutcome}</span>
          </p>
        ) : null}
      </div>
    </section>
  );
}

export const MarketResolutionPanel = memo(MarketResolutionPanelInner);
