"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Swords } from "lucide-react";
import { fetchAttentionDashboard } from "@/shared/api/fetchers/attention-dashboard";
import { queryKeys } from "@/shared/api/query-keys";
import { ROUTES } from "@/shared/constants/routes";
import { cn } from "@/lib/utils";
import {
  NarrativeWarsComparisonTable,
  NarrativeWarsMarkets,
} from "./narrative-wars-comparison";

const DASHBOARD_LIMIT = 50;

const SELECT_CLASS =
  "w-full rounded-xl border-0 bg-[#08080d] px-3 py-2.5 text-[13px] font-medium text-zinc-100 ring-1 ring-white/[0.1] transition focus:outline-none focus:ring-cyan-400/40";

function NarrativeSelect({
  id,
  value,
  onChange,
  options,
  disabledSlug,
}: {
  id: string;
  value: string;
  onChange: (slug: string) => void;
  options: { slug: string; name: string }[];
  disabledSlug?: string;
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={SELECT_CLASS}
    >
      <option value="">Select narrative…</option>
      {options.map((option) => (
        <option
          key={option.slug}
          value={option.slug}
          disabled={disabledSlug === option.slug}
        >
          {option.name}
        </option>
      ))}
    </select>
  );
}

export function NarrativeWarsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [leftSlug, setLeftSlug] = useState(() => searchParams.get("left") ?? "");
  const [rightSlug, setRightSlug] = useState(() => searchParams.get("right") ?? "");

  const syncUrl = useCallback(
    (left: string, right: string) => {
      const params = new URLSearchParams();
      if (left) params.set("left", left);
      if (right) params.set("right", right);
      const qs = params.toString();
      router.replace(qs ? `${ROUTES.narrativeWars}?${qs}` : ROUTES.narrativeWars, {
        scroll: false,
      });
    },
    [router],
  );

  useEffect(() => {
    syncUrl(leftSlug, rightSlug);
  }, [leftSlug, rightSlug, syncUrl]);

  const dashboardQuery = useQuery({
    queryKey: queryKeys.hub.attentionDashboard(DASHBOARD_LIMIT),
    queryFn: () => fetchAttentionDashboard(DASHBOARD_LIMIT),
    staleTime: 60_000,
  });

  const narratives = useMemo(
    () => dashboardQuery.data?.data ?? [],
    [dashboardQuery.data?.data],
  );

  const narrativeOptions = useMemo(
    () =>
      narratives.map((item) => ({
        slug: item.narrativeSlug,
        name: item.narrativeName,
      })),
    [narratives],
  );

  const leftNarrative = useMemo(
    () => narratives.find((item) => item.narrativeSlug === leftSlug),
    [narratives, leftSlug],
  );

  const rightNarrative = useMemo(
    () => narratives.find((item) => item.narrativeSlug === rightSlug),
    [narratives, rightSlug],
  );

  const bothSelected = Boolean(leftSlug && rightSlug && leftNarrative && rightNarrative);

  return (
    <div className="space-y-8">
      <header className="border-b border-white/[0.06] pb-r24">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-400/90">
          <Swords className="h-3 w-3" aria-hidden />
          Head-to-head
        </p>
        <h1 className="mt-1.5 text-balance text-2xl font-semibold tracking-tight text-white sm:text-[1.75rem]">
          Narrative Wars
        </h1>
        <p className="mt-1.5 max-w-2xl text-[12.5px] text-zinc-500">
          Compare attention, conviction, and market depth across crypto narratives.
        </p>
      </header>

      <div className="glass-panel-strong space-y-4 rounded-2xl p-4 ring-1 ring-white/[0.06]">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Pick two narratives
        </p>
        <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-[1fr_auto_1fr]">
          <NarrativeSelect
            id="narrative-wars-left"
            value={leftSlug}
            onChange={setLeftSlug}
            options={narrativeOptions}
            disabledSlug={rightSlug || undefined}
          />
          <p
            className="text-center text-xl font-bold tracking-[0.2em] text-cyan-300/90"
            aria-hidden
          >
            VS
          </p>
          <NarrativeSelect
            id="narrative-wars-right"
            value={rightSlug}
            onChange={setRightSlug}
            options={narrativeOptions}
            disabledSlug={leftSlug || undefined}
          />
        </div>
      </div>

      {!bothSelected ? (
        <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/[0.1] bg-white/[0.02] px-6 py-16 text-center">
          <Swords className="h-8 w-8 text-zinc-600" aria-hidden />
          <p className="text-[14px] font-medium text-zinc-300">Select two narratives to compare</p>
          <p className="max-w-sm text-[12px] text-zinc-500">
            Choose from {narrativeOptions.length || "…"} tracked narratives to see scores,
            momentum, and top markets side by side.
          </p>
        </div>
      ) : (
        <>
          <NarrativeWarsComparisonTable
            left={leftNarrative!}
            right={rightNarrative!}
            leftSlug={leftSlug}
            rightSlug={rightSlug}
          />
          <NarrativeWarsMarkets
            leftSlug={leftSlug}
            rightSlug={rightSlug}
            leftName={leftNarrative!.narrativeName}
            rightName={rightNarrative!.narrativeName}
          />
        </>
      )}
    </div>
  );
}
