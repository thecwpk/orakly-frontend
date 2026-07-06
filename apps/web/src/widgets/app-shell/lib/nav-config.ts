import {
  Briefcase,
  Brain,
  Home,
  LayoutGrid,
  LineChart,
  Swords,
  Trophy,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";
import { ROUTES } from "@/shared/constants/routes";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Highlights the item for any path starting with `href` plus '/'. */
  matchSubtree?: boolean;
  /**
   * Active on `/markets` when `trending` query is off (full book).
   * Detail routes `/markets/[slug]` count as Markets.
   */
  marketsBrowse?: boolean;
  /** Active on `/markets` when `trending=1`. */
  trendingTape?: boolean;
  /** Hub home `/dapp` exact match. */
  hubHome?: boolean;
  /** Attention dashboard `/attention`. */
  attentionAnchor?: boolean;
  /** Historical analytics `/analytics`. */
  analyticsAnchor?: boolean;
  /** Narrative Wars `/narrative-wars`. */
  narrativeWarsAnchor?: boolean;
  /** Community markets `/markets/community`. */
  communityAnchor?: boolean;
  /** Leaderboard `/leaderboard`. */
  leaderboardAnchor?: boolean;
  /** Optional small badge text (static — e.g. "New"). */
  badge?: string;
  /** Live counter — optional badge on rich nav variants. */
  counter?: "marketsTotal" | "watchlistCount" | "notificationsUnread";
  /** Keyboard shortcut when expanded (e.g. "g m"). */
  shortcut?: string;
  /** Shown only for platform admins. */
  requiresRole?: "ADMIN";
  /** Separator before operator-only items. */
  sectionBreak?: boolean;
};

export type NavGroup = {
  id: "rail" | "discover" | "markets";
  label?: string;
  items: NavItem[];
};

export function liveTapeQueryOn(
  searchParams: Pick<URLSearchParams, "get"> | null | undefined,
): boolean {
  const live = searchParams?.get("live");
  if (live === "1" || live === "true") return true;
  const t = searchParams?.get("trending");
  return t === "1" || t === "true";
}

/** @deprecated Use `liveTapeQueryOn` — legacy `trending` param. */
export function trendingQueryOn(
  searchParams: Pick<URLSearchParams, "get"> | null | undefined,
): boolean {
  return liveTapeQueryOn(searchParams);
}

/** Live-first sort on the directory explorer (`/markets?live=1`). */
export function isTrendingTapeActive(
  pathname: string | null,
  searchParams: Pick<URLSearchParams, "get"> | null | undefined,
): boolean {
  if (!pathname) return false;
  if (!liveTapeQueryOn(searchParams)) return false;
  return pathname === "/markets";
}

/** Legacy helper — discovery surface: `/discover` + `/markets` detail routes. */
export function isMarketsExplorerNavActive(pathname: string | null): boolean {
  if (!pathname) return false;
  if (pathname === ROUTES.discover || pathname.startsWith(`${ROUTES.discover}/`)) return true;
  if (pathname === "/markets") return true;
  return pathname.startsWith("/markets/");
}

/** Full Markets browse — directory + detail pages. */
export function isMarketsBrowseActive(
  pathname: string | null,
  searchParams: Pick<URLSearchParams, "get"> | null | undefined,
): boolean {
  if (!pathname) return false;
  if (pathname === ROUTES.dapp || pathname.startsWith(`${ROUTES.dapp}/`)) return false;
  if (pathname === ROUTES.attention || pathname.startsWith(`${ROUTES.attention}/`)) return false;
  if (pathname === ROUTES.analytics || pathname.startsWith(`${ROUTES.analytics}/`)) return false;
  if (pathname === ROUTES.narrativeWars || pathname.startsWith(`${ROUTES.narrativeWars}/`)) return false;
  if (pathname === ROUTES.marketsCommunity) return false;
  if (pathname.startsWith("/markets/") && pathname !== "/markets") return true;
  if (pathname === "/markets") return !liveTapeQueryOn(searchParams);
  if (pathname === ROUTES.discover || pathname.startsWith(`${ROUTES.discover}/`)) return true;
  return false;
}

export function isHubHomeActive(pathname: string | null): boolean {
  if (!pathname) return false;
  return pathname === ROUTES.dapp || pathname === ROUTES.home;
}

export function isAttentionAnchorActive(pathname?: string | null): boolean {
  if (pathname) {
    return pathname === ROUTES.attention || pathname.startsWith(`${ROUTES.attention}/`);
  }
  if (typeof window === "undefined") return false;
  const p = window.location.pathname;
  return p === ROUTES.attention || p.startsWith(`${ROUTES.attention}/`);
}

export function isAnalyticsActive(pathname: string | null): boolean {
  if (!pathname) return false;
  return pathname === ROUTES.analytics || pathname.startsWith(`${ROUTES.analytics}/`);
}

export function isNarrativeWarsActive(pathname: string | null): boolean {
  if (!pathname) return false;
  return pathname === ROUTES.narrativeWars || pathname.startsWith(`${ROUTES.narrativeWars}/`);
}

export function isCommunityMarketsActive(pathname: string | null): boolean {
  if (!pathname) return false;
  return pathname === ROUTES.marketsCommunity || pathname.startsWith(`${ROUTES.marketsCommunity}/`);
}

export function isLeaderboardActive(pathname: string | null): boolean {
  if (!pathname) return false;
  return pathname === ROUTES.leaderboard || pathname.startsWith(`${ROUTES.leaderboard}/`);
}

export function resolvePrimaryNavActive(
  pathname: string | null,
  item: Pick<
    NavItem,
    | "href"
    | "matchSubtree"
    | "marketsBrowse"
    | "trendingTape"
    | "hubHome"
    | "attentionAnchor"
    | "analyticsAnchor"
    | "narrativeWarsAnchor"
    | "communityAnchor"
    | "leaderboardAnchor"
  >,
  searchParams?: Pick<URLSearchParams, "get"> | null,
): boolean {
  if (item.attentionAnchor) return isAttentionAnchorActive(pathname);
  if (item.analyticsAnchor) return isAnalyticsActive(pathname);
  if (item.narrativeWarsAnchor) return isNarrativeWarsActive(pathname);
  if (item.communityAnchor) return isCommunityMarketsActive(pathname);
  if (item.leaderboardAnchor) return isLeaderboardActive(pathname);
  if (item.hubHome) return isHubHomeActive(pathname) && !isAttentionAnchorActive(pathname);
  if (item.trendingTape) return isTrendingTapeActive(pathname, searchParams);
  if (item.marketsBrowse) return isMarketsBrowseActive(pathname, searchParams);
  return isPathActive(pathname, item.href, item.matchSubtree);
}

export function isPathActive(
  pathname: string | null,
  href: string,
  matchSubtree: boolean | undefined,
): boolean {
  if (!pathname) return false;
  const base = href.split("#")[0] ?? href;
  if (base === "/") return pathname === "/";
  if (matchSubtree) return pathname === base || pathname.startsWith(`${base}/`);
  return pathname === base;
}

/**
 * Primary destinations for `g` chord shortcuts + mobile dock.
 */
export const NAV_GROUPS: readonly NavGroup[] = [
  {
    id: "rail",
    items: [
      {
        href: ROUTES.dapp,
        label: "Home",
        icon: Home,
        hubHome: true,
        shortcut: "g h",
      },
      {
        href: ROUTES.marketsBrowse,
        label: "Market",
        icon: LayoutGrid,
        marketsBrowse: true,
        shortcut: "g m",
      },
      {
        href: ROUTES.attention,
        label: "Attention",
        icon: Brain,
        attentionAnchor: true,
        shortcut: "g a",
      },
      {
        href: ROUTES.analytics,
        label: "Analytics",
        icon: LineChart,
        analyticsAnchor: true,
        shortcut: "g y",
      },
      {
        href: ROUTES.portfolio,
        label: "Portfolio",
        icon: Briefcase,
        shortcut: "g p",
      },
    ],
  },
  {
    id: "discover",
    label: "Discover",
    items: [
      {
        href: ROUTES.narrativeWars,
        label: "Narrative Wars",
        icon: Swords,
        narrativeWarsAnchor: true,
        shortcut: "g w",
      },
      {
        href: ROUTES.leaderboard,
        label: "Leaderboard",
        icon: Trophy,
        leaderboardAnchor: true,
        shortcut: "g l",
      },
    ],
  },
  {
    id: "markets",
    label: "Markets",
    items: [
      {
        href: ROUTES.marketsCommunity,
        label: "Community",
        icon: Users,
        communityAnchor: true,
      },
    ],
  },
] as const;

/** Mobile dock — hub spec: Home, Markets, Attention, Portfolio, Profile. */
export const MOBILE_DOCK_ITEMS: readonly NavItem[] = [
  {
    href: ROUTES.dapp,
    label: "Home",
    icon: Home,
    hubHome: true,
  },
  {
    href: ROUTES.marketsBrowse,
    label: "Market",
    icon: LayoutGrid,
    marketsBrowse: true,
  },
  {
    href: ROUTES.attention,
    label: "Attention",
    icon: Brain,
    attentionAnchor: true,
  },
  {
    href: ROUTES.analytics,
    label: "Analytics",
    icon: LineChart,
    analyticsAnchor: true,
  },
  {
    href: ROUTES.portfolio,
    label: "Portfolio",
    icon: Briefcase,
  },
  {
    href: ROUTES.profile,
    label: "Profile",
    icon: User,
    matchSubtree: true,
  },
] as const;
