import "server-only";

import type { Market } from "@orakly/types";
import { prisma } from "@orakly/database";
import { prismaMarketToFeedDto, type MarketFeedRow } from "./market-feed-mapper";

export type EnrichedMarketFeedDto = Omit<Market, "creatorAddress" | "attentionScore"> & {
  creatorAddress: string | null;
  resolutionSource: string | null;
  resolutionDate: string | null;
  narrative: string | null;
  attentionScore: number | null;
  convictionScore: number | null;
  momentum: string;
  creatorRewardPercent: number;
};

type EnrichedMarketFields = Pick<
  EnrichedMarketFeedDto,
  | "creatorAddress"
  | "resolutionSource"
  | "resolutionDate"
  | "narrative"
  | "attentionScore"
  | "convictionScore"
  | "momentum"
  | "creatorRewardPercent"
>;

export const ENRICHED_MARKET_DEFAULTS: EnrichedMarketFields = {
  creatorAddress: null,
  resolutionSource: null,
  resolutionDate: null,
  narrative: null,
  attentionScore: null,
  convictionScore: null,
  momentum: "Stable",
  creatorRewardPercent: 0,
};

type AttentionLookup = {
  score: number;
  convictionScore: number;
};

function narrativeKeys(raw: string | null | undefined): string[] {
  const narrative = raw?.trim();
  if (!narrative) return [];
  const slug = narrative.toLowerCase().replace(/\s+/g, "-");
  return [narrative.toLowerCase(), slug];
}

async function loadAttentionByNarrative(
  narratives: string[],
): Promise<Map<string, AttentionLookup>> {
  const keys = new Set<string>();
  for (const narrative of narratives) {
    for (const key of narrativeKeys(narrative)) {
      keys.add(key);
    }
  }

  if (keys.size === 0) {
    return new Map();
  }

  const keyList = [...keys];
  const originals = [...new Set(narratives.map((n) => n.trim()).filter(Boolean))];
  const rows = await prisma.attentionScore.findMany({
    where: {
      OR: [
        { narrativeSlug: { in: keyList } },
        { narrative: { in: originals } },
      ],
    },
    select: {
      narrative: true,
      narrativeSlug: true,
      score: true,
      convictionScore: true,
    },
  });

  const map = new Map<string, AttentionLookup>();
  for (const row of rows) {
    const entry: AttentionLookup = {
      score: Number(row.score),
      convictionScore: row.convictionScore,
    };
    if (row.narrativeSlug.trim()) {
      map.set(row.narrativeSlug.trim().toLowerCase(), entry);
    }
    map.set(row.narrative.trim().toLowerCase(), entry);
    map.set(
      row.narrative.trim().toLowerCase().replace(/\s+/g, "-"),
      entry,
    );
  }

  return map;
}

function resolveAttention(
  narrative: string | null | undefined,
  attentionByKey: Map<string, AttentionLookup>,
): { attentionScore: number | null; convictionScore: number | null } {
  for (const key of narrativeKeys(narrative)) {
    const hit = attentionByKey.get(key);
    if (hit) {
      return {
        attentionScore: Number.isFinite(hit.score) ? hit.score : null,
        convictionScore: Number.isFinite(hit.convictionScore) ? hit.convictionScore : null,
      };
    }
  }
  return { attentionScore: null, convictionScore: null };
}

export function enrichStaticMarkets(markets: Market[]): EnrichedMarketFeedDto[] {
  return markets.map((market) => ({
    ...market,
    ...ENRICHED_MARKET_DEFAULTS,
  }));
}

export async function mapRowsToEnrichedFeedDto(
  rows: MarketFeedRow[],
): Promise<EnrichedMarketFeedDto[]> {
  if (rows.length === 0) return [];

  const attentionByKey = await loadAttentionByNarrative(
    rows.map((row) => row.narrative ?? "").filter(Boolean),
  );

  return rows.map((row) => {
    const base = prismaMarketToFeedDto(row);
    const { attentionScore, convictionScore } = resolveAttention(
      row.narrative,
      attentionByKey,
    );

    return {
      ...base,
      creatorAddress: row.creatorAddress?.toLowerCase() ?? null,
      resolutionSource: row.resolutionSource ?? null,
      resolutionDate: row.resolvedAt?.toISOString() ?? null,
      narrative: row.narrative ?? null,
      attentionScore,
      convictionScore,
      momentum: row.momentum?.trim() || "Stable",
      creatorRewardPercent: row.creatorRewardPercent ?? 0,
    };
  });
}
