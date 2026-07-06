import "server-only";

import { prisma } from "@orakly/database";

export const ATTENTION_WEIGHT_KEYS = [
  "attention_weight_volume",
  "attention_weight_liquidity",
  "attention_weight_markets",
  "attention_weight_traders",
  "attention_weight_engagement",
] as const;

export const CONVICTION_WEIGHT_KEYS = [
  "conviction_weight_capital",
  "conviction_weight_position_size",
  "conviction_weight_liquidity",
  "conviction_weight_open_positions",
] as const;

export const CREATOR_REWARD_KEY = "creator_default_reward_percent";

export const ALL_CONFIG_KEYS = [
  ...ATTENTION_WEIGHT_KEYS,
  ...CONVICTION_WEIGHT_KEYS,
  CREATOR_REWARD_KEY,
] as const;

export type JobScheduleDisplay = {
  jobName: string;
  interval: string;
  lastRun: string;
  nextRun: string;
};

const JOB_ENV_SPECS = [
  {
    jobName: "Crypto Ingest",
    intervalEnv: "JOB_CRYPTO_INGEST_INTERVAL",
    lastRunEnv: "JOB_CRYPTO_INGEST_LAST_RUN",
    nextRunEnv: "JOB_CRYPTO_INGEST_NEXT_RUN",
    defaultInterval: "15 min",
  },
  {
    jobName: "Narrative Update",
    intervalEnv: "JOB_NARRATIVE_UPDATE_INTERVAL",
    lastRunEnv: "JOB_NARRATIVE_UPDATE_LAST_RUN",
    nextRunEnv: "JOB_NARRATIVE_UPDATE_NEXT_RUN",
    defaultInterval: "30 min",
  },
  {
    jobName: "Probability Recompute",
    intervalEnv: "JOB_PROBABILITY_RECOMPUTE_INTERVAL",
    lastRunEnv: "JOB_PROBABILITY_RECOMPUTE_LAST_RUN",
    nextRunEnv: "JOB_PROBABILITY_RECOMPUTE_NEXT_RUN",
    defaultInterval: "10 s",
  },
  {
    jobName: "Market Resolution",
    intervalEnv: "JOB_MARKET_RESOLUTION_INTERVAL",
    lastRunEnv: "JOB_MARKET_RESOLUTION_LAST_RUN",
    nextRunEnv: "JOB_MARKET_RESOLUTION_NEXT_RUN",
    defaultInterval: "6 h",
  },
] as const;

export async function getPlatformConfigMap(): Promise<Record<string, string>> {
  const rows = await prisma.platformConfig.findMany({
    select: { key: true, value: true },
  });

  const map: Record<string, string> = {};
  for (const row of rows) {
    map[row.key] = row.value;
  }
  return map;
}

export async function upsertPlatformConfigs(
  entries: ReadonlyArray<{ key: string; value: string }>,
  updatedBy: string,
): Promise<Record<string, string>> {
  await prisma.$transaction(async (tx) => {
    for (const entry of entries) {
      await tx.platformConfig.upsert({
        where: { key: entry.key },
        create: {
          key: entry.key,
          value: entry.value,
          updatedBy,
        },
        update: {
          value: entry.value,
          updatedBy,
        },
      });
    }
  });

  return getPlatformConfigMap();
}

export function getJobSchedulesFromEnv(): JobScheduleDisplay[] {
  return JOB_ENV_SPECS.map((spec) => ({
    jobName: spec.jobName,
    interval:
      process.env[spec.intervalEnv]?.trim() || spec.defaultInterval,
    lastRun: process.env[spec.lastRunEnv]?.trim() || "—",
    nextRun: process.env[spec.nextRunEnv]?.trim() || "—",
  }));
}
