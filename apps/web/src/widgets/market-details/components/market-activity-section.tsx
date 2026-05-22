"use client";

import { memo, useState } from "react";
import type { MarketRealtimeSnapshot } from "@/websocket/store/market-realtime-store";
import { cn } from "@/lib/utils";
import { MarketActivityFeed } from "./market-activity-feed";
import { MarketDetailSection } from "./market-detail-section";

type Tab = "all" | "whales";

function MarketActivitySectionInner({
  tradeMarketId,
  rt,
}: {
  tradeMarketId: string | null;
  rt: MarketRealtimeSnapshot;
}) {
  const [tab, setTab] = useState<Tab>("all");

  const tabs = (
    <div
      role="tablist"
      aria-label="Activity filter"
      className="inline-flex rounded-md bg-black/35 p-0.5 ring-1 ring-white/10"
    >
      {(
        [
          ["all", "All"],
          ["whales", "Large"],
        ] as const
      ).map(([id, label]) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={tab === id}
          onClick={() => setTab(id)}
          className={cn(
            "rounded px-2 py-0.5 text-[10px] font-semibold transition",
            tab === id
              ? "bg-white/10 text-zinc-100 ring-1 ring-white/15"
              : "text-zinc-500 hover:text-zinc-300",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );

  return (
    <MarketDetailSection
      title="Activity"
      hint="Live prints on this market"
      action={tabs}
    >
      <MarketActivityFeed
        tradeMarketId={tradeMarketId}
        rt={rt}
        filter={tab === "whales" ? "whales" : "all"}
        maxRows={24}
        className="w-full"
      />
    </MarketDetailSection>
  );
}

export const MarketActivitySection = memo(MarketActivitySectionInner);
