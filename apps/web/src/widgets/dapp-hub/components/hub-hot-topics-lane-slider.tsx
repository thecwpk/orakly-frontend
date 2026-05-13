"use client";

import { PrefetchLink } from "@/shared/ui";
import type { Market } from "@orakly/types";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/shared/constants/routes";

/** Ticker-style short label (slug head or truncated title) — similar density to venue tapes. */
export function hubHotTopicShortLabel(m: Market): string {
  const head = m.slug.split("-")[0]?.replace(/[^a-z0-9]/gi, "") ?? "";
  if (head.length >= 2) return head.slice(0, 14).toUpperCase();
  const t = m.title.trim();
  if (t.length <= 18) return t;
  return `${t.slice(0, 17)}…`;
}

function LaneItem({ m }: { m: Market }) {
  const yes = Math.round((m.probability ?? 0.5) * 100);
  const no = 100 - yes;
  const label = hubHotTopicShortLabel(m);
  return (
    <PrefetchLink
      href={ROUTES.market(m.slug)}
      className="inline-flex shrink-0 items-baseline gap-1.5 px-1 py-0.5 font-mono text-[10px] leading-none tracking-wide text-zinc-400 transition hover:text-zinc-200"
    >
      <span className="max-w-[200px] truncate text-zinc-200/95">{label}</span>
      <span className="tabular-nums text-emerald-400/95">{yes}%</span>
      <span className="text-zinc-600" aria-hidden>
        /
      </span>
      <span className="tabular-nums text-rose-400/90">{no}%</span>
    </PrefetchLink>
  );
}

export function HubHotTopicsLaneSlider({
  markets,
  loading,
}: {
  markets: readonly Market[];
  loading?: boolean;
}) {
  const loop = markets.length ? [...markets, ...markets] : [];

  if (loading && !markets.length) {
    return (
      <div
        className="mb-5 overflow-hidden rounded-md border border-white/[0.06] bg-black/35 py-2.5 ring-1 ring-white/[0.04]"
        aria-busy="true"
        aria-label="Loading cross-lane hot topics"
      >
        <div className="flex gap-10 px-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-3 w-24 shrink-0 animate-pulse rounded bg-white/[0.07]" />
          ))}
        </div>
      </div>
    );
  }

  if (!markets.length) {
    return (
      <div className="mb-5 rounded-md border border-white/[0.06] bg-black/30 px-3 py-2.5 ring-1 ring-white/[0.04]">
        <p className="text-center font-mono text-[9.5px] leading-relaxed text-zinc-500">
          Cross-lane topics appear when the five hub feeds overlap — syncing…
        </p>
      </div>
    );
  }

  return (
    <div
      className="mb-5 overflow-hidden rounded-md border border-white/[0.06] bg-black/35 py-2 ring-1 ring-white/[0.04] motion-reduce:overflow-x-auto"
      aria-label="Hot topics from five hub feeds (cross-lane)"
    >
      <div
        className={cn(
          "flex w-max items-baseline gap-x-10 whitespace-nowrap px-4 py-0.5",
          loop.length > 1 ? "nav-ticker-track" : "",
        )}
      >
        {loop.map((m, i) => (
          <LaneItem key={`${m.id}-${i}`} m={m} />
        ))}
      </div>
    </div>
  );
}
