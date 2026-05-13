/**
 * Canonical category taxonomy for the public-facing UI.
 * The `CategoriesSection` and the `/markets/create` wizard both pull from here so
 * adding a category in one place propagates everywhere.
 *
 * Server-side admin categories live in Prisma; this file is a UX-grade superset
 * with deterministic accent hues for the design system.
 */
import {
  Atom,
  Bot,
  Coins,
  Cpu,
  Globe2,
  Landmark,
  Trophy,
  type LucideIcon,
} from "lucide-react";

export type CategoryAccent =
  | "cyan"
  | "violet"
  | "emerald"
  | "sky"
  | "rose"
  | "amber"
  | "fuchsia";

export type MarketCategory = {
  slug: string;
  name: string;
  blurb: string;
  icon: LucideIcon;
  accent: CategoryAccent;
};

export const MARKET_CATEGORIES: readonly MarketCategory[] = [
  {
    slug: "crypto",
    name: "Crypto",
    blurb: "BTC, ETH, alts, on-chain milestones.",
    icon: Coins,
    accent: "cyan",
  },
  {
    slug: "macro",
    name: "Macro",
    blurb: "Rates, CPI, central-bank decisions.",
    icon: Landmark,
    accent: "violet",
  },
  {
    slug: "politics",
    name: "Politics",
    blurb: "Elections, policy, geopolitics.",
    icon: Globe2,
    accent: "emerald",
  },
  {
    slug: "science",
    name: "Science",
    blurb: "Discoveries, missions, research.",
    icon: Atom,
    accent: "sky",
  },
  {
    slug: "culture",
    name: "Culture",
    blurb: "Sports, awards, entertainment.",
    icon: Trophy,
    accent: "rose",
  },
  {
    slug: "ai-tech",
    name: "AI & Tech",
    blurb: "Model launches, product ships, IPOs.",
    icon: Cpu,
    accent: "amber",
  },
  {
    slug: "memes",
    name: "Memes",
    blurb: "Narrative trades, internet lore.",
    icon: Bot,
    accent: "fuchsia",
  },
] as const;

export function findCategory(slug: string): MarketCategory | undefined {
  return MARKET_CATEGORIES.find((c) => c.slug === slug);
}
