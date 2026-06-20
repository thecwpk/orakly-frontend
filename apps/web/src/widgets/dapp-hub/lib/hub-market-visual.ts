import type { LucideIcon } from "lucide-react";
import {
  Bitcoin,
  Bot,
  Briefcase,
  Cpu,
  FlaskConical,
  Gamepad2,
  Globe2,
  Landmark,
  Rocket,
  Smile,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react";

export type HubMarketVisual = {
  bg: string;
  iconColor: string;
  Icon: LucideIcon;
};

const DEFAULT: HubMarketVisual = {
  bg: "#eff6ff",
  iconColor: "#2563eb",
  Icon: TrendingUp,
};

function match(text: string, patterns: RegExp[]): boolean {
  return patterns.some((p) => p.test(text));
}

/** Category + title heuristics → Polymarket-style card thumbnail. */
export function resolveHubMarketVisual(
  category: string | null | undefined,
  title: string,
): HubMarketVisual {
  const cat = (category ?? "").toLowerCase();
  const t = title.toLowerCase();
  const blob = `${cat} ${t}`;

  if (match(blob, [/\bmeme\b|doge|pepe|shib/])) {
    return { bg: "#fef9c3", iconColor: "#ca8a04", Icon: Smile };
  }
  if (match(blob, [/sport|nba|nfl|mls|uefa|messi|chiefs|lakers|super bowl/])) {
    return { bg: "#ecfdf5", iconColor: "#059669", Icon: Trophy };
  }
  if (match(blob, [/politic|election|tiktok|turnout|labour|trump|fed\b|cpi|opec/])) {
    return { bg: "#fef2f2", iconColor: "#dc2626", Icon: Landmark };
  }
  if (match(blob, [/btc|bitcoin|eth|crypto|solana|etf|stablecoin|defi|base chain|nvda|token/])) {
    return { bg: "#fff7ed", iconColor: "#ea580c", Icon: Bitcoin };
  }
  if (match(blob, [/ai\b|llm|gpt|openai|nvidia|bar-exam|agentic/])) {
    return { bg: "#f5f3ff", iconColor: "#7c3aed", Icon: Bot };
  }
  if (match(blob, [/tech|apple|ar glass|quantum|spacex/])) {
    return { bg: "#eef2ff", iconColor: "#4f46e5", Icon: Cpu };
  }
  if (match(blob, [/science|fusion|qubit|lab/])) {
    return { bg: "#ecfeff", iconColor: "#0891b2", Icon: FlaskConical };
  }
  if (match(blob, [/gaming|gamefi/])) {
    return { bg: "#fdf4ff", iconColor: "#c026d3", Icon: Gamepad2 };
  }
  if (match(blob, [/macro|econom|finance|rate/])) {
    return { bg: "#f0fdf4", iconColor: "#15803d", Icon: Briefcase };
  }
  if (match(blob, [/ecosystem|solana|base\b|rwa/])) {
    return { bg: "#ecfeff", iconColor: "#0e7490", Icon: Globe2 };
  }
  if (match(blob, [/breaking|signal/])) {
    return { bg: "#fff1f2", iconColor: "#e11d48", Icon: Zap };
  }
  if (match(blob, [/ipo|launch/])) {
    return { bg: "#f0f9ff", iconColor: "#0284c7", Icon: Rocket };
  }

  if (cat.includes("crypto") || cat.includes("meme")) return { bg: "#fff7ed", iconColor: "#ea580c", Icon: Bitcoin };
  if (cat.includes("sport")) return { bg: "#ecfdf5", iconColor: "#059669", Icon: Trophy };
  if (cat.includes("politic")) return { bg: "#fef2f2", iconColor: "#dc2626", Icon: Landmark };
  if (cat.includes("tech")) return { bg: "#eef2ff", iconColor: "#4f46e5", Icon: Cpu };
  if (cat.includes("science")) return { bg: "#ecfeff", iconColor: "#0891b2", Icon: FlaskConical };
  if (cat.includes("macro")) return { bg: "#f0fdf4", iconColor: "#15803d", Icon: Briefcase };
  if (cat.includes("sentiment")) return { bg: "#eff6ff", iconColor: "#2563eb", Icon: TrendingUp };

  return DEFAULT;
}
