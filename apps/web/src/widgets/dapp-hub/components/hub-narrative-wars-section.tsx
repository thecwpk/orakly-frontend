"use client";

import { useNarrativeWarsQuery } from "@/shared/api/hooks";
import { HubNarrativeWarCard } from "./hub-narrative-war-card";
import { HubSectionShell } from "./hub-section-shell";

export function HubNarrativeWarsSection() {
  const warsQ = useNarrativeWarsQuery();

  return (
    <HubSectionShell
      className="hub-section--mobile-reorder-wars hub-section-glass"
      title="Narrative Wars"
      subtitle="Who is winning the attention battle right now?"
    >
      {warsQ.isLoading ? (
        <div className="grid gap-[var(--hub-card-gap)] lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="hub-skeleton h-64 rounded-[var(--hub-radius)]" />
          ))}
        </div>
      ) : (
        <div className="grid gap-[var(--hub-card-gap)] lg:grid-cols-3">
          {(warsQ.data ?? []).map((battle) => (
            <HubNarrativeWarCard key={battle.id} battle={battle} />
          ))}
        </div>
      )}
    </HubSectionShell>
  );
}
