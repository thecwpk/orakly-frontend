import {
  Activity,
  Briefcase,
  LayoutGrid,
  TrendingUp,
  Wallet,
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
  id: "rail";
  label?: string;
  items: NavItem[];
};

export function trendingQueryOn(
  searchParams: Pick<URLSearchParams, "get"> | null | undefined,
): boolean {
  const t = searchParams?.get("trending");
  return t === "1" || t === "true";
}

/** Trending tape on the directory explorer (`/markets?trending=1`). */
export function isTrendingTapeActive(
  pathname: string | null,
  searchParams: Pick<URLSearchParams, "get"> | null | undefined,
): boolean {
  if (!pathname) return false;
  if (!trendingQueryOn(searchParams)) return false;
  return pathname === "/markets";
}

/** Full Markets browse — directory + detail pages + marketing `/discover`; not the `/` hub tape. */
export function isMarketsBrowseActive(
  pathname: string | null,
  searchParams: Pick<URLSearchParams, "get"> | null | undefined,
): boolean {
  if (!pathname) return false;
  if (pathname === ROUTES.discover || pathname.startsWith(`${ROUTES.discover}/`)) return true;
  if (pathname.startsWith("/markets/") && pathname !== "/markets") return true;
  if (pathname !== "/markets") return false;
  return !trendingQueryOn(searchParams);
}

/** Legacy helper — discovery surface: `/discover` + `/markets` detail routes. */
export function isMarketsExplorerNavActive(pathname: string | null): boolean {
  if (!pathname) return false;
  if (pathname === ROUTES.discover || pathname.startsWith(`${ROUTES.discover}/`)) return true;
  if (pathname === "/markets") return true;
  return pathname.startsWith("/markets/");
}

export function resolvePrimaryNavActive(
  pathname: string | null,
  item: Pick<
    NavItem,
    "href" | "matchSubtree" | "marketsBrowse" | "trendingTape"
  >,
  searchParams?: Pick<URLSearchParams, "get"> | null,
): boolean {
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
  if (href === "/") return pathname === "/";
  if (matchSubtree) return pathname === href || pathname.startsWith(`${href}/`);
  return pathname === href;
}

/**
 * Primary destinations for `g` chord shortcuts + mobile dock — top bar stays minimal;
 * Portfolio / Activity / Wallet sit in the profile menu on desktop.
 */
export const NAV_GROUPS: readonly NavGroup[] = [
  {
    id: "rail",
    items: [
      {
        href: ROUTES.discover,
        label: "Markets",
        icon: LayoutGrid,
        marketsBrowse: true,
        shortcut: "g m",
      },
      {
        href: ROUTES.marketsTrending,
        label: "Trending",
        icon: TrendingUp,
        trendingTape: true,
        shortcut: "g t",
      },
      {
        href: ROUTES.portfolio,
        label: "Portfolio",
        icon: Briefcase,
        shortcut: "g p",
      },
      {
        href: ROUTES.activity,
        label: "Activity",
        icon: Activity,
        shortcut: "g a",
      },
      {
        href: ROUTES.wallet,
        label: "Wallet",
        icon: Wallet,
        shortcut: "g w",
      },
    ],
  },
] as const;

/** Mobile dock — dense primary flows; Wallet lives in header popover. */
export const MOBILE_DOCK_ITEMS: readonly NavItem[] = [
  {
    href: ROUTES.discover,
    label: "Markets",
    icon: LayoutGrid,
    marketsBrowse: true,
  },
  {
    href: ROUTES.marketsTrending,
    label: "Trending",
    icon: TrendingUp,
    trendingTape: true,
  },
  {
    href: ROUTES.portfolio,
    label: "Portfolio",
    icon: Briefcase,
  },
  {
    href: ROUTES.activity,
    label: "Activity",
    icon: Activity,
  },
] as const;
