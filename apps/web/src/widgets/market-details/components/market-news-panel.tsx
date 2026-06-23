"use client";

import type { Market } from "@orakly/types";
import { ExternalLink, Loader2 } from "lucide-react";
import { useMemo } from "react";
import { buildSpotlightNewsLines } from "@/widgets/dapp-hub/lib/hub-spotlight-news";
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
  const fallbackLines = useMemo(() => buildSpotlightNewsLines(market.title), [market.title]);

  const hasApiArticles = (newsPayload?.articles?.length ?? 0) > 0;

  const articles =
    newsPayload?.articles?.length ?
      newsPayload.articles.slice(0, 6)
    : fallbackLines.map((line) => ({
        url: `#wire-${line.source}`,
        title: line.headline,
        source: line.source,
        publishedAt: line.ago,
      }));

  return (
    <section
      className={cn(marketDetailPanelClass, "flex min-h-0 flex-col p-3 sm:p-3.5", className)}
      aria-label="Related headlines"
    >
      <h2 className="text-sm font-semibold text-[var(--md-fg)]">Related wire</h2>

      {isLoading && !hasApiArticles ? (
        <div className="mt-4 flex items-center gap-2 text-[var(--md-muted)]">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-xs">Loading headlines…</span>
        </div>
      ) : null}
      {isError && !hasApiArticles ? (
        <p className="mt-3 text-xs text-[var(--md-danger)]">Headlines unavailable.</p>
      ) : null}

      {articles.length ? (
        <ul className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain scrollbar-terminal max-h-none lg:max-h-[min(320px,50vh)]">
          {articles.map((a) => (
            <li key={`${a.url}-${a.title}`} className="border-b border-[var(--md-border)] pb-3 last:border-b-0 last:pb-0">
              {a.url.startsWith("#") ? (
                <div className="flex gap-2 text-left">
                  <span className="mt-0.5 h-5 w-5 shrink-0 rounded-sm bg-[color-mix(in_srgb,var(--md-bg-subtle)_80%,transparent)] ring-1 ring-[var(--md-border)]" />
                  <span className="min-w-0">
                    <span className="line-clamp-2 text-[12px] font-medium leading-snug text-[var(--md-fg)]">
                      {a.title}
                    </span>
                    <span className="mt-1 flex flex-wrap gap-x-2 font-mono text-[9px] text-[var(--md-muted)]">
                      {a.source ? <span>{a.source}</span> : null}
                      {a.publishedAt ? <span>{a.publishedAt}</span> : null}
                    </span>
                  </span>
                </div>
              ) : (
                <a
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex gap-2 text-left"
                >
                  <span className="mt-0.5 shrink-0 text-[var(--md-muted)] group-hover:text-[var(--md-primary)]">
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="line-clamp-2 text-[12px] font-medium leading-snug text-[var(--md-fg)] group-hover:underline">
                      {a.title}
                    </span>
                    <span className="mt-1 flex flex-wrap gap-x-2 font-mono text-[9px] text-[var(--md-muted)]">
                      {a.source ? <span>{a.source}</span> : null}
                      {a.publishedAt ? <span>{a.publishedAt}</span> : null}
                    </span>
                  </span>
                </a>
              )}
            </li>
          ))}
        </ul>
      ) : !isLoading ? (
        <p className="mt-3 text-xs text-[var(--md-muted)]">No headlines.</p>
      ) : null}
    </section>
  );
}
