import "server-only";

import { ActivityType, MarketStatus } from "@prisma/client";
import { prisma } from "@orakly/database";
import { narrativeMarketWhere } from "./narrative-markets";

export type NarrativeTimelineEvent = {
  id: string;
  at: string;
  kind: "MARKET_CREATED" | "MARKET_RESOLVED" | "ATTENTION_MILESTONE" | "TRADE" | "OTHER";
  description: string;
};

export async function getNarrativeTimeline(
  narrative: string,
  limit = 20,
): Promise<NarrativeTimelineEvent[]> {
  const take = Math.min(Math.max(limit, 1), 50);
  const slug = narrative.trim();
  if (!slug) return [];

  const markets = await prisma.market.findMany({
    where: narrativeMarketWhere(slug),
    select: {
      id: true,
      title: true,
      status: true,
      createdAt: true,
      resolvedAt: true,
      resolvedOutcome: true,
      attentionScore: true,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const marketIds = markets.map((m) => m.id);
  const events: NarrativeTimelineEvent[] = [];

  for (const m of markets) {
    events.push({
      id: `created-${m.id}`,
      at: m.createdAt.toISOString(),
      kind: "MARKET_CREATED",
      description: `Market created: ${m.title}`,
    });
    if (m.status === MarketStatus.RESOLVED && m.resolvedAt) {
      const outcome = m.resolvedOutcome ?? "unknown";
      events.push({
        id: `resolved-${m.id}`,
        at: m.resolvedAt.toISOString(),
        kind: "MARKET_RESOLVED",
        description: `Market resolved (${outcome}): ${m.title}`,
      });
    }
    const attention = m.attentionScore ?? 0;
    if (attention >= 70) {
      events.push({
        id: `attn-${m.id}`,
        at: m.createdAt.toISOString(),
        kind: "ATTENTION_MILESTONE",
        description: `Attention milestone — score reached ${Math.round(attention)} on ${m.title}`,
      });
    }
  }

  if (marketIds.length > 0) {
    const activities = await prisma.activity.findMany({
      where: {
        marketId: { in: marketIds },
        type: {
          in: [
            ActivityType.TRADE,
            ActivityType.MARKET_CREATED,
            ActivityType.MARKET_RESOLVED,
            ActivityType.LARGE_TRADE,
          ],
        },
      },
      orderBy: { createdAt: "desc" },
      take: take * 2,
      select: {
        id: true,
        createdAt: true,
        type: true,
        title: true,
        market: { select: { title: true } },
      },
    });

    for (const a of activities) {
      events.push({
        id: a.id,
        at: a.createdAt.toISOString(),
        kind:
          a.type === ActivityType.MARKET_RESOLVED
            ? "MARKET_RESOLVED"
            : a.type === ActivityType.MARKET_CREATED
              ? "MARKET_CREATED"
              : a.type === ActivityType.TRADE || a.type === ActivityType.LARGE_TRADE
                ? "TRADE"
                : "OTHER",
        description:
          a.title?.trim() ||
          `${a.type.replace(/_/g, " ").toLowerCase()}: ${a.market?.title ?? "market"}`,
      });
    }
  }

  return events
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, take);
}

export type NarrativeCommentDto = {
  id: string;
  body: string;
  walletAddress: string | null;
  createdAt: string;
  narrativeSlug: string;
};

export async function listNarrativeComments(
  narrativeSlug: string,
  take = 50,
): Promise<NarrativeCommentDto[]> {
  const slug = narrativeSlug.trim().toLowerCase();
  const rows = await prisma.activity.findMany({
    where: { type: ActivityType.NARRATIVE_COMMENT },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      createdAt: true,
      payload: true,
      user: { select: { walletAddress: true } },
    },
  });

  return rows
    .map((r) => {
      const payload =
        r.payload && typeof r.payload === "object" && !Array.isArray(r.payload)
          ? (r.payload as Record<string, unknown>)
          : {};
      const rowSlug =
        typeof payload.narrativeSlug === "string"
          ? payload.narrativeSlug.toLowerCase()
          : "";
      return {
        id: r.id,
        body: typeof payload.body === "string" ? payload.body : "",
        walletAddress: r.user?.walletAddress?.toLowerCase() ?? null,
        createdAt: r.createdAt.toISOString(),
        narrativeSlug: rowSlug || slug,
        _match: rowSlug === slug,
      };
    })
    .filter((r) => r._match)
    .slice(0, Math.min(Math.max(take, 1), 100))
    .map(({ _match: _, ...rest }) => rest);
}

export async function createNarrativeComment(input: {
  narrativeSlug: string;
  userId: string;
  body: string;
}): Promise<NarrativeCommentDto> {
  const body = input.body.trim();
  if (!body) throw new Error("EMPTY_BODY");
  if (body.length > 2000) throw new Error("BODY_TOO_LONG");

  const slug = input.narrativeSlug.trim().toLowerCase();
  const row = await prisma.activity.create({
    data: {
      type: ActivityType.NARRATIVE_COMMENT,
      userId: input.userId,
      title: "Narrative comment",
      payload: {
        kind: "NARRATIVE_COMMENT",
        narrativeSlug: slug,
        body,
      },
    },
    select: {
      id: true,
      createdAt: true,
      payload: true,
      user: { select: { walletAddress: true } },
    },
  });

  return {
    id: row.id,
    body,
    walletAddress: row.user?.walletAddress?.toLowerCase() ?? null,
    createdAt: row.createdAt.toISOString(),
    narrativeSlug: slug,
  };
}
