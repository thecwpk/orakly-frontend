"use client";

import { useNarrativeWarsQuery } from "@/shared/api/hooks";
import { cn } from "@/lib/utils";
import { HubNarrativeWarCard } from "./hub-narrative-war-card";
import { HubSectionShell } from "./hub-section-shell";

export function HubNarrativeWarsSection({ className }: { className?: string }) {
  const warsQ = useNarrativeWarsQuery();

  return (
    <HubSectionShell
      className={cn("hub-section--mobile-reorder-wars hub-section-glass", className)}
      title="Narrative matchups"
      subtitle="Head-to-head attention battles between trending themes."
      compact
    >
      {warsQ.isLoading ? (
        <div className="grid gap-[var(--hub-card-gap)]">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="hub-skeleton h-52 rounded-[var(--hub-radius)]" />
          ))}
        </div>
      ) : (
        <div className="grid gap-[var(--hub-card-gap)]">
          {(warsQ.data ?? []).map((battle) => (
            <HubNarrativeWarCard key={battle.id} battle={battle} />
          ))}
        </div>
      )}
    </HubSectionShell>
  );
}
