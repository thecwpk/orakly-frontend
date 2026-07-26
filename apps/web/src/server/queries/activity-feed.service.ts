import "server-only";

import { ActivityType, MarketSuggestionStatus } from "@prisma/client";
import { prisma } from "@orakly/database";
import type { FeedActivityPayload } from "@orakly/realtime-protocol";
import type { MarketActivityEvent } from "@/shared/contracts/market-activity";
import { marketActivityToFeedPayload } from "@/shared/lib/market-activity-map";
import { withPublicTradeable } from "./public-tradeable-market";

function truncate(text: string, max: number): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function toNum(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function payloadObj(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  return {};
}

function hoursUntil(isoOrDate: Date | string | null | undefined): number | null {
  if (!isoOrDate) return null;
  const ms = new Date(isoOrDate).getTime() - Date.now();
  if (!Number.isFinite(ms) || ms <= 0) return 0;
  return Math.max(1, Math.round(ms / (60 * 60 * 1000)));
}

function eventWhenLabel(publishedAt: string | null): string {
  if (!publishedAt) return "Soon";
  const ms = new Date(publishedAt).getTime() - Date.now();
  if (!Number.isFinite(ms)) return "Soon";
  if (ms < 0) return "Recently";
  const days = Math.ceil(ms / (24 * 60 * 60 * 1000));
  if (days <= 1) return "Tomorrow";
  return `In ${days} days`;
}

/**
 * Hub Market Activity tape — maps Activity/Trade (+ synthetic closing / votes / news)
 * into the six frozen event kinds.
 */
export async function getMarketActivityFeed(input?: {
  limit?: number;
}): Promise<MarketActivityEvent[]> {
  const limit = Math.min(Math.max(input?.limit ?? 10, 1), 40);
  const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const closingBefore = new Date(Date.now() + 48 * 60 * 60 * 1000);

  const [activities, closingMarkets, suggestions, news] = await Promise.all([
    prisma.activity.findMany({
      where: {
        createdAt: { gte: since },
        type: {
          in: [
            ActivityType.TRADE,
            ActivityType.MARKET_CREATED,
            ActivityType.ADMIN_ACTION,
          ],
        },
      },
      orderBy: { createdAt: "desc" },
      take: Math.max(limit * 3, 30),
      select: {
        id: true,
        createdAt: true,
        type: true,
        title: true,
        payload: true,
        marketId: true,
        market: {
          select: {
            slug: true,
            title: true,
            category: { select: { name: true } },
            volumeTotalUsd: true,
            closesAt: true,
          },
        },
        trade: {
          select: {
            outcome: true,
            notionalUsd: true,
            taker: { select: { walletAddress: true } },
            buyer: { select: { walletAddress: true } },
          },
        },
      },
    }),
    prisma.market.findMany({
      where: withPublicTradeable({
        closesAt: { gt: new Date(), lte: closingBefore },
      }),
      orderBy: { closesAt: "asc" },
      take: 6,
      select: {
        id: true,
        slug: true,
        title: true,
        closesAt: true,
        volumeTotalUsd: true,
        category: { select: { name: true } },
      },
    }),
    prisma.marketSuggestion.findMany({
      where: {
        OR: [
          { updatedAt: { gte: since }, voteCount: { gt: 0 } },
          {
            status: MarketSuggestionStatus.APPROVED,
            updatedAt: { gte: since },
          },
        ],
      },
      orderBy: { updatedAt: "desc" },
      take: 8,
      select: {
        id: true,
        title: true,
        category: true,
        voteCount: true,
        status: true,
        updatedAt: true,
        market: { select: { slug: true } },
      },
    }),
    fetchUpcomingNews(3).catch(() => [] as MarketActivityEvent[]),
  ]);

  const events: MarketActivityEvent[] = [];

  for (const row of activities) {
    const p = payloadObj(row.payload);
    const question =
      row.market?.title ||
      (typeof p.question === "string" ? p.question : null) ||
      row.title ||
      "Market";

    if (row.type === ActivityType.TRADE && row.trade) {
      const wallet =
        row.trade.taker.walletAddress?.toLowerCase() ||
        row.trade.buyer.walletAddress?.toLowerCase() ||
        null;
      const notional = toNum(row.trade.notionalUsd);
      events.push({
        id: `trade:${row.id}`,
        kind: "TRADE",
        at: row.createdAt.toISOString(),
        question: truncate(question, 55),
        marketSlug: row.market?.slug ?? null,
        walletAddress: wallet,
        outcome: row.trade.outcome === "NO" ? "NO" : "YES",
        amountBnb: Number(notional.toFixed(4)),
      });
      continue;
    }

    if (row.type === ActivityType.MARKET_CREATED) {
      const fromCommunity =
        String(p.source ?? p.origin ?? "").toLowerCase().includes("community") ||
        String(p.kind ?? "").toLowerCase().includes("approv");
      events.push({
        id: `created:${row.id}`,
        kind: fromCommunity ? "MARKET_APPROVED" : "MARKET_CREATED",
        at: row.createdAt.toISOString(),
        question: truncate(question, 55),
        marketSlug: row.market?.slug ?? null,
        category: row.market?.category?.name ?? null,
      });
      continue;
    }

    if (row.type === ActivityType.ADMIN_ACTION) {
      const action = String(p.kind ?? p.action ?? p.message ?? row.title ?? "").toLowerCase();
      if (action.includes("approv")) {
        events.push({
          id: `approved:${row.id}`,
          kind: "MARKET_APPROVED",
          at: row.createdAt.toISOString(),
          question: truncate(question, 55),
          marketSlug: row.market?.slug ?? null,
          category: row.market?.category?.name ?? null,
        });
      }
    }
  }

  for (const m of closingMarkets) {
    events.push({
      id: `closing:${m.id}`,
      kind: "MARKET_CLOSING",
      at: m.closesAt?.toISOString() ?? new Date().toISOString(),
      question: truncate(m.title, 55),
      marketSlug: m.slug,
      category: m.category?.name ?? null,
      hoursUntilClose: hoursUntil(m.closesAt),
      volumeUsd: toNum(m.volumeTotalUsd),
    });
  }

  for (const s of suggestions) {
    if (s.status === MarketSuggestionStatus.APPROVED && s.market?.slug) {
      events.push({
        id: `suggestion-approved:${s.id}`,
        kind: "MARKET_APPROVED",
        at: s.updatedAt.toISOString(),
        question: truncate(s.title, 55),
        marketSlug: s.market.slug,
        category: s.category,
      });
    }
    if (s.voteCount > 0) {
      events.push({
        id: `vote:${s.id}`,
        kind: "COMMUNITY_VOTE",
        at: s.updatedAt.toISOString(),
        question: truncate(s.title, 45),
        marketSlug: null,
        voteCount: s.voteCount,
        suggestionId: s.id,
        category: s.category,
      });
    }
  }

  events.push(...news);

  return events
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, limit);
}

async function fetchUpcomingNews(take: number): Promise<MarketActivityEvent[]> {
  try {
    const { fetchGoogleNewsRss } = await import("@/server/news/google-news-rss");
    const articles = await fetchGoogleNewsRss(
      "cryptocurrency OR bitcoin OR ethereum event",
      take,
    );
    return articles.slice(0, take).map((a, i) => ({
      id: `news:${Buffer.from(a.url).toString("base64url").slice(0, 24)}`,
      kind: "UPCOMING_EVENT" as const,
      at: a.publishedAt ?? new Date(Date.now() - i * 60_000).toISOString(),
      question: truncate(a.title, 70),
      marketSlug: null,
      eventName: truncate(a.title, 70),
      eventWhenLabel: eventWhenLabel(a.publishedAt),
    }));
  } catch {
    return [];
  }
}

/** Legacy Socket.IO / tape shape — keep HTTP fallback compatible with feed store. */
export async function getActivityFeed(input?: {
  take?: number;
}): Promise<FeedActivityPayload[]> {
  const limit = Math.min(Math.max(input?.take ?? 120, 1), 40);
  const events = await getMarketActivityFeed({ limit });
  return events.map(marketActivityToFeedPayload);
}
