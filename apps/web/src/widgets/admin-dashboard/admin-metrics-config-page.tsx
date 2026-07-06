"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Settings2, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { ROUTES } from "@/shared/constants/routes";
import { cn } from "@/lib/utils";
import { AdminConsoleFrame } from "./components/admin-console-frame";
import { Section, TabShell } from "./components/tab-shell";
import { useAdminMeQuery } from "./hooks/use-admin-queries";
import {
  AdminApiError,
  fetchAdminConfig,
  putAdminConfig,
  type JobScheduleRow,
} from "./lib/admin-api";
import { adminUi } from "./lib/admin-ui-classes";
import type { AdminTabId } from "./lib/permissions";
import "@/widgets/admin-dashboard/admin-hub-scope.css";

const ATTENTION_FIELDS = [
  { key: "attention_weight_volume", label: "Volume" },
  { key: "attention_weight_liquidity", label: "Liquidity" },
  { key: "attention_weight_markets", label: "Active Markets" },
  { key: "attention_weight_traders", label: "Unique Traders" },
  { key: "attention_weight_engagement", label: "Engagement" },
] as const;

const CONVICTION_FIELDS = [
  { key: "conviction_weight_capital", label: "Capital Committed" },
  { key: "conviction_weight_position_size", label: "Avg Position Size" },
  { key: "conviction_weight_liquidity", label: "Liquidity Depth" },
  { key: "conviction_weight_open_positions", label: "Open Positions" },
] as const;

const CREATOR_REWARD_KEY = "creator_default_reward_percent";

const adminConfigQueryKey = ["admin", "platform-config"] as const;

function parseWeight(value: string): number {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : 0;
}

function WeightSum({
  sum,
  target = 100,
}: {
  sum: number;
  target?: number;
}) {
  const valid = sum === target;
  return (
    <p className={cn("text-[12px] font-mono tabular-nums", valid ? "text-emerald-300" : "text-rose-300")}>
      Current total: {sum} / {target}
      {!valid ? (
        <span className="ml-2 font-sans text-[11px] text-rose-200/90">
          Weights must sum to exactly {target}.
        </span>
      ) : null}
    </p>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  min?: number;
  max?: number;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold text-[var(--hub-muted)]">{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={adminUi.input}
      />
    </label>
  );
}

function JobSchedulesTable({ rows }: { rows: JobScheduleRow[] }) {
  return (
    <div className="overflow-x-auto rounded-xl ring-1 ring-[var(--hub-border)]">
      <table className="w-full min-w-[640px] border-collapse text-left text-[12.5px]">
        <thead className={adminUi.tableHead}>
          <tr>
            <th className="px-4 py-2.5">Job Name</th>
            <th className="px-4 py-2.5">Current Interval</th>
            <th className="px-4 py-2.5">Last Run</th>
            <th className="px-4 py-2.5">Next Run</th>
          </tr>
        </thead>
        <tbody className={adminUi.tableRow}>
          {rows.map((row) => (
            <tr key={row.jobName} className="hover:bg-[var(--hub-bg-subtle)]/50">
              <td className="px-4 py-2.5 font-medium text-[var(--hub-fg)]">{row.jobName}</td>
              <td className="px-4 py-2.5 font-mono tabular-nums">{row.interval}</td>
              <td className="px-4 py-2.5 font-mono tabular-nums text-[var(--hub-muted)]">
                {row.lastRun}
              </td>
              <td className="px-4 py-2.5 font-mono tabular-nums text-[var(--hub-muted)]">
                {row.nextRun}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AdminMetricsConfigPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const meQ = useAdminMeQuery(true);

  const configQ = useQuery({
    queryKey: adminConfigQueryKey,
    queryFn: fetchAdminConfig,
    enabled: meQ.data?.role === "ADMIN",
    staleTime: 30_000,
  });

  const [attention, setAttention] = useState<Record<string, string>>({});
  const [conviction, setConviction] = useState<Record<string, string>>({});
  const [creatorReward, setCreatorReward] = useState("5");

  useEffect(() => {
    if (!configQ.data?.configs) return;
    const c = configQ.data.configs;
    setAttention(
      Object.fromEntries(ATTENTION_FIELDS.map((f) => [f.key, c[f.key] ?? "0"])),
    );
    setConviction(
      Object.fromEntries(CONVICTION_FIELDS.map((f) => [f.key, c[f.key] ?? "0"])),
    );
    setCreatorReward(c[CREATOR_REWARD_KEY] ?? "5");
  }, [configQ.data?.configs]);

  const attentionSum = useMemo(
    () => ATTENTION_FIELDS.reduce((sum, f) => sum + parseWeight(attention[f.key] ?? "0"), 0),
    [attention],
  );

  const convictionSum = useMemo(
    () => CONVICTION_FIELDS.reduce((sum, f) => sum + parseWeight(conviction[f.key] ?? "0"), 0),
    [conviction],
  );

  const creatorRewardNum = parseWeight(creatorReward);
  const creatorRewardValid = creatorRewardNum >= 0 && creatorRewardNum <= 20;

  const saveMutation = useMutation({
    mutationFn: putAdminConfig,
    onSuccess: () => {
      toast.success("Configuration saved");
      void qc.invalidateQueries({ queryKey: adminConfigQueryKey });
    },
    onError: (e) => {
      toast.error(e instanceof AdminApiError ? e.message : "Save failed");
    },
  });

  const isAdmin = meQ.data?.role === "ADMIN";
  const jobSchedules = configQ.data?.jobSchedules ?? [];

  const handleTabSelect = (id: AdminTabId) => {
    if (id === "markets") {
      router.push(ROUTES.adminMarkets);
      return;
    }
    router.push(ROUTES.adminDashboard);
  };

  let content: ReactNode;

  if (isAdmin && configQ.isLoading) {
    content = (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--hub-primary-bright)]" />
      </div>
    );
  } else if (!isAdmin) {
    content = (
      <div className="mx-auto max-w-lg">
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-amber-500/15 bg-amber-500/5 px-4 py-12 text-center">
          <ShieldAlert className="h-8 w-8 text-amber-200" />
          <p className="text-[14px] font-semibold text-amber-100">Admin access required</p>
          <p className="text-[12px] text-amber-100/70">
            Platform metrics configuration is restricted to ADMIN role accounts.
          </p>
        </div>
      </div>
    );
  } else {
    content = (
      <TabShell
        eyebrow="Platform"
        title="Metrics configuration"
        description="Tune attention and conviction scoring weights, creator defaults, and review background job schedules."
      >
        <Section
          title="Attention Score Formula Weights"
          description="Each component must total 100 when combined."
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ATTENTION_FIELDS.map((field) => (
              <NumberField
                key={field.key}
                label={field.label}
                value={attention[field.key] ?? "0"}
                onChange={(v) => setAttention((prev) => ({ ...prev, [field.key]: v }))}
              />
            ))}
          </div>
          <div className="mt-4 space-y-3">
            <WeightSum sum={attentionSum} />
            <button
              type="button"
              disabled={attentionSum !== 100 || saveMutation.isPending}
              onClick={() =>
                saveMutation.mutate(
                  ATTENTION_FIELDS.map((f) => ({
                    key: f.key,
                    value: String(parseWeight(attention[f.key] ?? "0")),
                  })),
                )
              }
              className={adminUi.btnPrimary}
            >
              {saveMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Settings2 className="h-3.5 w-3.5" />
              )}
              Save Attention Weights
            </button>
          </div>
        </Section>

        <Section
          title="Conviction Score Formula Weights"
          description="Each component must total 100 when combined."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {CONVICTION_FIELDS.map((field) => (
              <NumberField
                key={field.key}
                label={field.label}
                value={conviction[field.key] ?? "0"}
                onChange={(v) => setConviction((prev) => ({ ...prev, [field.key]: v }))}
              />
            ))}
          </div>
          <div className="mt-4 space-y-3">
            <WeightSum sum={convictionSum} />
            <button
              type="button"
              disabled={convictionSum !== 100 || saveMutation.isPending}
              onClick={() =>
                saveMutation.mutate(
                  CONVICTION_FIELDS.map((f) => ({
                    key: f.key,
                    value: String(parseWeight(conviction[f.key] ?? "0")),
                  })),
                )
              }
              className={adminUi.btnPrimary}
            >
              Save Conviction Weights
            </button>
          </div>
        </Section>

        <Section title="Creator Rewards">
          <div className="max-w-xs">
            <NumberField
              label="Default Creator Reward %"
              value={creatorReward}
              onChange={setCreatorReward}
              min={0}
              max={20}
            />
          </div>
          <p className="mt-2 text-[11.5px] text-[var(--hub-muted)]">
            Applied to new approved markets unless overridden
          </p>
          <div className="mt-4">
            <button
              type="button"
              disabled={!creatorRewardValid || saveMutation.isPending}
              onClick={() =>
                saveMutation.mutate([
                  {
                    key: CREATOR_REWARD_KEY,
                    value: String(creatorRewardNum),
                  },
                ])
              }
              className={adminUi.btnPrimary}
            >
              Save
            </button>
            {!creatorRewardValid ? (
              <p className="mt-2 text-[11px] text-rose-300">Reward must be between 0 and 20.</p>
            ) : null}
          </div>
        </Section>

        <Section
          title="Current Job Schedules"
          description="Read-only — intervals and run times are controlled via deployment environment variables."
        >
          <JobSchedulesTable rows={jobSchedules} />
        </Section>
      </TabShell>
    );
  }

  return (
    <AdminConsoleFrame
      activeTab={null}
      onTabSelect={handleTabSelect}
      bootstrapReturnPath={ROUTES.adminConfig}
      mobileTitle="Metrics Config"
      contentKey="metrics-config"
    >
      {content}
    </AdminConsoleFrame>
  );
}
