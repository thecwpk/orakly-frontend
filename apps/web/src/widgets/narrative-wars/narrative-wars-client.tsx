"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { fetchAttentionDashboard } from "@/shared/api/fetchers/attention-dashboard";
import { queryKeys } from "@/shared/api/query-keys";
import { ROUTES } from "@/shared/constants/routes";
import { cn } from "@/lib/utils";
import {
  NarrativeWarsComparisonTable,
  NarrativeWarsMarkets,
} from "./narrative-wars-comparison";

const DASHBOARD_LIMIT = 50;

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
      className={cn(
        "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-medium text-gray-900",
        "shadow-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-200",
      )}
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
    <div className="space-y-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Narrative Wars</h1>
        <p className="text-sm text-gray-500">
          Compare attention, conviction, and market depth across crypto narratives.
        </p>
      </header>

      <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-[1fr_auto_1fr]">
        <NarrativeSelect
          id="narrative-wars-left"
          value={leftSlug}
          onChange={setLeftSlug}
          options={narrativeOptions}
          disabledSlug={rightSlug || undefined}
        />
        <p className="text-center text-2xl font-bold text-gray-900" aria-hidden>
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

      {!bothSelected ? (
        <div className="flex min-h-[240px] items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 px-6 py-16 text-center">
          <p className="text-base font-medium text-gray-500">
            Select two narratives to compare
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
