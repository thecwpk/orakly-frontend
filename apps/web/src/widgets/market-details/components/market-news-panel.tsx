"use client";

import type { Market } from "@orakly/types";
import { ExternalLink, Loader2 } from "lucide-react";
import { useMemo } from "react";
import { useDiscoveryNewsQuery } from "@/shared/api/hooks/use-discovery-news-query";
import { cn } from "@/lib/utils";
import { marketDetailPanelClass } from "./market-detail-section";

export function buildMarketNewsQuery(market: Market): string {
  const t = market.title.replace(/["'`]/g, " ").trim();
  const words = t.split(/\s+/).filter(Boolean).slice(0, 10).join(" ");
  const cat = (market.category ?? "").trim().toLowerCase();
  const cryptoish = ["crypto", "defi", "meme"].some((k) => cat.includes(k));
  const q =
    cat && !cryptoish
      ? `${words} ${cat} markets news`
      : cat
        ? `(${cat}) ${words}`
        : `${words} financial markets news`;
  return q.slice(0, 260);
}

export function MarketNewsPanel({ market, className }: { market: Market; className?: string }) {
  const q = useMemo(() => buildMarketNewsQuery(market), [market]);
  const { data: newsPayload, isLoading, isError } = useDiscoveryNewsQuery(q);

  return (
    <section
      className={cn(marketDetailPanelClass, "flex min-h-0 flex-col p-3 sm:p-3.5", className)}
      aria-label="Related headlines"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-600">
        Context
      </p>
      <h2 className="text-sm font-semibold text-zinc-100">Related wire</h2>
      <p className="mt-0.5 text-[11px] text-zinc-600">
        Headlines matched to this market. Links open the publisher.
      </p>

      {isLoading ? (
        <div className="mt-4 flex items-center gap-2 text-zinc-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-xs">Loading headlines…</span>
        </div>
      ) : null}
      {isError ? (
        <p className="mt-3 text-xs text-rose-400">Headlines unavailable right now.</p>
      ) : null}
      {!isLoading && !isError && newsPayload?.articles?.length ? (
        <ul className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain scrollbar-terminal max-h-none lg:max-h-[min(320px,50vh)]">
          {newsPayload.articles.slice(0, 6).map((a) => (
            <li key={a.url} className="border-b border-white/[0.06] pb-3 last:border-b-0 last:pb-0">
              <a
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex gap-2 text-left"
              >
                <span className="mt-0.5 shrink-0 text-zinc-500 group-hover:text-cyan-300">
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="line-clamp-2 text-[12px] font-medium leading-snug text-zinc-200 group-hover:underline">
                    {a.title}
                  </span>
                  <span className="mt-1 flex flex-wrap gap-x-2 font-mono text-[9px] text-zinc-600">
                    {a.source ? <span>{a.source}</span> : null}
                    {a.publishedAt ? <span>{a.publishedAt}</span> : null}
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      ) : !isLoading && !isError ? (
        <p className="mt-3 text-xs text-zinc-500">No headlines returned for this topic.</p>
      ) : null}
    </section>
  );
}
