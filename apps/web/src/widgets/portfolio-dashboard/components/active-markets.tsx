"use client";

import type { Market, MarketStatus } from "@orakly/types";
import type { PortfolioSnapshot } from "@/shared/api/fetchers/portfolio";
import { DenseMarketCard } from "@/widgets/landing/components/dense-market-card";
import { motion } from "framer-motion";
import { memo, useMemo } from "react";

function coerceStatus(s: string): MarketStatus {
  const u = s.toUpperCase();
  return u === "OPEN" || u === "RESOLVED" || u === "CLOSED" ? u : "OPEN";
}

function heldMarketFromPosition(p: PortfolioSnapshot["positions"][number]): Market {
  const liq = Number.parseFloat(p.market.liquidityUsd) || 0;
  const yes = Number.parseFloat(p.market.yesPrice ?? "") || 0.5;
  const no = Number.parseFloat(p.market.noPrice ?? "") || 0.5;
  return {
    id: p.market.id,
    slug: p.market.slug,
    title: p.market.title,
    category: "Your book",
    volumeUsd: liq,
    liquidityUsd: liq,
    probability: p.side === "YES" ? yes : no,
    closesAt: new Date(Date.now() + 7 * 864e5).toISOString(),
    status: coerceStatus(p.market.status),
  };
}

function ActiveMarketsInner({
  positions,
  feedMarkets,
}: {
  positions: PortfolioSnapshot["positions"];
  feedMarkets: Market[] | undefined;
}) {
  const positionIds = useMemo(() => new Set(positions.map((p) => p.market.id)), [positions]);

  const rows = useMemo(() => {
    const held = positions.map(heldMarketFromPosition);

    const discover =
      feedMarkets?.filter((m) => m.status === "OPEN" && !positionIds.has(m.id)).slice(0, 6) ?? [];

    return { held, discover };
  }, [feedMarkets, positionIds, positions]);

  return (
    <div className="space-y-6">
      {rows.held.length > 0 ?
        <section>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-3 flex items-end justify-between gap-3"
          >
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Active book</p>
              <p className="text-sm font-medium text-white">Markets you carry</p>
            </div>
          </motion.div>
          <div className="grid gap-3 sm:grid-cols-2">
            {rows.held.map((m, i) => (
              <DenseMarketCard key={m.id} market={m} href={`/markets/${m.slug}`} accent="cyan" index={i} />
            ))}
          </div>
        </section>
      : null}

      <section>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
          className="mb-3"
        >
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Discover</p>
          <p className="text-sm font-medium text-white">Liquid OPEN markets</p>
        </motion.div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.discover.map((m, i) => (
            <DenseMarketCard key={m.id} market={m} href={`/markets/${m.slug}`} accent="violet" index={i} />
          ))}
        </div>
        {!rows.discover.length ?
          <p className="py-6 text-center text-[13px] text-zinc-500">Feed loading or no open markets.</p>
        : null}
      </section>
    </div>
  );
}

export const ActiveMarkets = memo(ActiveMarketsInner);
