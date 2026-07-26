"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { fetchAttentionDashboard } from "@/shared/api/fetchers/attention-dashboard";
import { queryKeys } from "@/shared/api/query-keys";
import { ROUTES } from "@/shared/constants/routes";
import { SUGGESTED_BATTLES } from "@/widgets/dapp-hub/lib/narrative-war-pairs";
import { cn } from "@/lib/utils";
import {
  NarrativeWarsComparisonTable,
  NarrativeWarsMarkets,
} from "./narrative-wars-comparison";

const DASHBOARD_LIMIT = 50;

const SELECT_CLASS =
  "w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-3 text-[14px] font-medium text-[var(--foreground)] outline-none focus:border-blue-500/50";

function NarrativeSelect({
  id,
  label,
  value,
  onChange,
  options,
  disabledSlug,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (slug: string) => void;
  options: { slug: string; name: string }[];
  disabledSlug?: string;
}) {
  return (
    <div className="flex w-full max-w-sm flex-col gap-1.5">
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={SELECT_CLASS}
        aria-label={label}
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
    </div>
  );
}

function findSlug(
  options: { slug: string; name: string }[],
  nameOrSlug: string,
): string {
  const key = nameOrSlug.trim().toLowerCase();
  const bySlug = options.find((o) => o.slug.toLowerCase() === key);
  if (bySlug) return bySlug.slug;
  const byName = options.find((o) => o.name.toLowerCase() === key);
  return byName?.slug ?? key;
}

export function NarrativeWarsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlLeft = searchParams.get("left") ?? "";
  const urlRight = searchParams.get("right") ?? "";

  const [leftSlug, setLeftSlug] = useState(urlLeft);
  const [rightSlug, setRightSlug] = useState(urlRight);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setLeftSlug(urlLeft);
    setRightSlug(urlRight);
  }, [urlLeft, urlRight]);

  const syncUrl = useCallback(
    (left: string, right: string) => {
      const params = new URLSearchParams();
      if (left) params.set("left", left);
      if (right) params.set("right", right);
      const qs = params.toString();
      const next = qs ? `${ROUTES.narrativeWars}?${qs}` : ROUTES.narrativeWars;
      const current =
        typeof window !== "undefined"
          ? `${window.location.pathname}${window.location.search}`
          : "";
      if (current === next) return;
      router.replace(next, { scroll: false });
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

  function pickBattle(leftName: string, rightName: string) {
    const left = findSlug(narrativeOptions, leftName);
    const right = findSlug(narrativeOptions, rightName);
    setLeftSlug(left);
    setRightSlug(right);
  }

  async function shareBattle() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success("Copied!");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Unable to copy link");
    }
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-[32px] font-bold tracking-tight text-[var(--foreground)]">
          Narrative Wars
        </h1>
        <p className="mt-1 text-[15px] text-[var(--foreground-muted)]">
          Compare two crypto narratives side by side.
        </p>
      </header>

      {/* Selector row */}
      <div className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
        <NarrativeSelect
          id="narrative-wars-left"
          label="Left narrative"
          value={leftSlug}
          onChange={setLeftSlug}
          options={narrativeOptions}
          disabledSlug={rightSlug || undefined}
        />
        <p
          className="text-[32px] font-bold tracking-tight text-[var(--foreground-muted)]"
          aria-hidden
        >
          VS
        </p>
        <NarrativeSelect
          id="narrative-wars-right"
          label="Right narrative"
          value={rightSlug}
          onChange={setRightSlug}
          options={narrativeOptions}
          disabledSlug={leftSlug || undefined}
        />
      </div>

      {!bothSelected ? (
        <section className="space-y-4">
          <div className="text-center">
            <p className="text-[15px] font-medium text-[var(--foreground)]">Suggested Comparisons</p>
            <p className="mt-1 text-[13px] text-[var(--foreground-muted)]">
              Select a suggested pair, or choose narratives from the menus above.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {SUGGESTED_BATTLES.map((battle) => (
              <button
                key={battle.id}
                type="button"
                onClick={() => pickBattle(battle.leftSlug, battle.rightSlug)}
                className={cn(
                  "rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 text-left transition",
                  "hover:scale-[1.02] hover:border-[var(--border)] hover:shadow-lg",
                )}
              >
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">
                  Suggested
                </p>
                <p className="mt-2 text-[18px] font-bold text-[var(--foreground)]">
                  {battle.leftName}{" "}
                  <span className="text-[var(--foreground-muted)]">vs</span> {battle.rightName}
                </p>
              </button>
            ))}
          </div>
        </section>
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

          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => void shareBattle()}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-[14px] font-semibold text-white transition hover:bg-blue-500"
            >
              {copied ? "Copied!" : "Share This Battle"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
