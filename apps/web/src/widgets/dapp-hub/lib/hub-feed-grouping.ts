import type { HubMarketEnriched } from "@/shared/contracts/hub-home";

export type HubFeedMultiGroup = {
  kind: "multi";
  id: string;
  eventTitle: string;
  category: string | null;
  markets: HubMarketEnriched[];
  totalVolumeUsd: number;
};

export type HubFeedBinaryItem = {
  kind: "binary";
  market: HubMarketEnriched;
};

export type HubFeedItem = HubFeedMultiGroup | HubFeedBinaryItem;

const EVENT_RULES: { match: RegExp; key: string; title: string }[] = [
  { match: /world cup|fifa/i, key: "world-cup", title: "World Cup Winner" },
  { match: /nba finals|lakers|finals/i, key: "nba-finals", title: "NBA Finals" },
  { match: /super bowl|chiefs/i, key: "super-bowl", title: "Super Bowl" },
  { match: /uefa|champions league|real madrid/i, key: "ucl", title: "Champions League" },
  { match: /\betf\b|spot etf/i, key: "etf", title: "ETF Markets" },
  { match: /\bbtc\b|bitcoin|ath/i, key: "btc", title: "Bitcoin" },
  { match: /fed|rate cut|cpi/i, key: "macro", title: "Macro" },
  { match: /solana|\bsol\b/i, key: "solana", title: "Solana" },
  { match: /messi|mls/i, key: "mls", title: "MLS" },
];

function eventGroupKey(market: HubMarketEnriched): string | null {
  const blob = `${market.category ?? ""} ${market.title}`.toLowerCase();
  for (const rule of EVENT_RULES) {
    if (rule.match.test(blob)) return rule.key;
  }
  return null;
}

function eventTitleForKey(key: string): string {
  return EVENT_RULES.find((r) => r.key === key)?.title ?? "Trending outcomes";
}

/** Short label for multi-outcome row (e.g. "France", "Spain"). */
export function outcomeRowLabel(title: string): string {
  const t = title.trim();
  const willMatch = t.match(/^will\s+(.+?)\s+(win|hit|exceed|pass|approve|complete)/i);
  if (willMatch?.[1]) {
    const chunk = willMatch[1].replace(/\?.*$/, "").trim();
    const words = chunk.split(/\s+/).slice(0, 3);
    return words.join(" ");
  }
  const beforeQ = t.split("?")[0]?.trim() ?? t;
  const words = beforeQ.split(/\s+/).slice(0, 4);
  return words.join(" ");
}

export function isUpDownMarket(title: string): boolean {
  return /\b(up or down|up\/down|\d+\s*m\b|\d+\s*min\b|ath|flip|exceed)\b/i.test(title);
}

export function groupHubFeedMarkets(markets: HubMarketEnriched[]): HubFeedItem[] {
  const buckets = new Map<string, HubMarketEnriched[]>();
  const solo: HubMarketEnriched[] = [];

  for (const m of markets) {
    const key = eventGroupKey(m);
    if (!key) {
      solo.push(m);
      continue;
    }
    const list = buckets.get(key) ?? [];
    list.push(m);
    buckets.set(key, list);
  }

  const items: HubFeedItem[] = [];

  for (const [key, group] of buckets) {
    if (group.length >= 2) {
      const sorted = [...group].sort((a, b) => b.probability - a.probability);
      items.push({
        kind: "multi",
        id: `multi:${key}`,
        eventTitle: eventTitleForKey(key),
        category: sorted[0]?.category ?? null,
        markets: sorted,
        totalVolumeUsd: sorted.reduce((s, m) => s + m.volumeUsd, 0),
      });
    } else {
      solo.push(...group);
    }
  }

  for (const m of solo) {
    items.push({ kind: "binary", market: m });
  }

  items.sort((a, b) => {
    const volA = a.kind === "multi" ? a.totalVolumeUsd : a.market.volumeUsd;
    const volB = b.kind === "multi" ? b.totalVolumeUsd : b.market.volumeUsd;
    return volB - volA;
  });

  return items;
}

/** Polymarket-style quick bet hints on Up/Down buttons. */
export function quickBetHints(probability: number): { yes: number; no: number; yesTrail: number[]; noTrail: number[] } {
  const tiers = [1, 5, 23, 47, 100];
  const yesIdx = Math.min(tiers.length - 1, Math.max(0, Math.floor(probability * tiers.length)));
  const noIdx = Math.min(tiers.length - 1, Math.max(0, Math.floor((1 - probability) * tiers.length)));
  const yes = tiers[yesIdx] ?? 100;
  const no = tiers[noIdx] ?? 47;
  return {
    yes,
    no,
    yesTrail: [1, 23].filter((v) => v !== yes),
    noTrail: [1].filter((v) => v !== no),
  };
}

export function marketIsLive(m: HubMarketEnriched): boolean {
  return (m.momentumPct ?? 0) > 4 || m.volume24hUsd > 400_000;
}
