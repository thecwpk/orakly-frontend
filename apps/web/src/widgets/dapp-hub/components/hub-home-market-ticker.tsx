"use client";

import { useMemo } from "react";
import type { Market } from "@orakly/types";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/shared/constants/routes";
import { PrefetchLink } from "@/shared/ui";

const TAKE = 12;
/** Insert a plain “View all” link in the tape rhythm (between pills, like reference). */
const VIEW_ALL_EVERY_N_PILLS = 3;

type TickerRow = { key: string; slug: string; title: string; yes: number; no: number };
type TapeNode = ({ kind: "pill" } & TickerRow) | { kind: "viewAll"; key: string };

function buildRows(markets: readonly Market[]): TickerRow[] {
  const seen = new Set<string>();
  const out: TickerRow[] = [];
  for (const m of markets) {
    if (seen.has(m.id)) continue;
    seen.add(m.id);
    const yes = Math.round((m.probability ?? 0.5) * 100);
    const no = 100 - yes;
    const title = m.title.length > 40 ? `${m.title.slice(0, 38)}…` : m.title;
    out.push({ key: m.id, slug: m.slug, title, yes, no });
    if (out.length >= TAKE) break;
  }
  if (!out.length) {
    return [{ key: "idle", slug: "", title: "No markets loaded", yes: 0, no: 0 }];
  }
  return out;
}

function buildTapeSequence(rows: readonly TickerRow[]): TapeNode[] {
  const out: TapeNode[] = [];
  rows.forEach((row, i) => {
    out.push({ kind: "pill", ...row });
    if ((i + 1) % VIEW_ALL_EVERY_N_PILLS === 0) {
      out.push({ kind: "viewAll", key: `va-${row.key}-${i}` });
    }
  });
  return out;
}

/** Full-bleed markets marquee — capsule pills + “View all” woven into the scroll (hub only). */
export function HubHomeMarketTicker({ markets }: { markets: readonly Market[] }) {
  const rows = useMemo(() => buildRows(markets), [markets]);
  const tape = useMemo(() => {
    const seq = buildTapeSequence(rows);
    return [...seq, ...seq];
  }, [rows]);
  const animate = tape.length > 1;

  return (
    <div className="mb-ticker-bleed">
      <div className="mb-ticker">
        <div className="mb-ticker__viewport">
          <div className="mb-ticker__fade-left" aria-hidden />
          <div className="mb-ticker__fade-right" aria-hidden />
          <div className={cn("mb-ticker__track mb-ticker__track--pills", animate ? "nav-ticker-track" : "")}>
            {tape.map((node, i) =>
              node.kind === "viewAll" ? (
                <PrefetchLink
                  key={`${node.key}-${i}`}
                  href={ROUTES.discover}
                  className="mb-ticker__view-all--inline"
                >
                  View all
                </PrefetchLink>
              ) : node.slug ? (
                <PrefetchLink
                  key={`${node.key}-${i}`}
                  href={ROUTES.market(node.slug)}
                  className="mb-ticker__capsule"
                >
                  <span className="mb-ticker__capsule-title">{node.title}</span>
                  <span className="mb-ticker__capsule-stats">
                    <span className="mb-ticker__capsule-yes">{node.yes}%</span>
                    <span className="mb-ticker__capsule-slash">/</span>
                    <span className="mb-ticker__capsule-no">{node.no}%</span>
                  </span>
                </PrefetchLink>
              ) : (
                <span key={`${node.key}-${i}`} className="mb-ticker__capsule mb-ticker__capsule--idle">
                  <span className="mb-ticker__capsule-title">{node.title}</span>
                  {node.yes + node.no > 0 ? (
                    <span className="mb-ticker__capsule-stats">
                      <span className="mb-ticker__capsule-yes">{node.yes}%</span>
                      <span className="mb-ticker__capsule-slash">/</span>
                      <span className="mb-ticker__capsule-no">{node.no}%</span>
                    </span>
                  ) : null}
                </span>
              ),
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
