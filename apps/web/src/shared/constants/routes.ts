/**
 * Canonical paths used across the app. Always import from here — never hardcode
 * a URL inline. When adding a route, update this map first; the navbar, the
 * settings sidebar, and feature CTAs all read from it.
 */
export const ROUTES = {
  /** App entry — trading hub (`/` permanently redirects here). */
  home: "/dapp",
  /** Legacy in-app landing URL — redirects to `dapp`. Marketing site is separate. */
  landing: "/landing",
  /** Trading hub home — attention terminal, narrative wars, opportunities. */
  dapp: "/dapp",
  DAPP: "/dapp",
  /** Attention dashboard — narrative momentum & matchups. */
  attention: "/attention",
  /** Narratives page (same as `attention`). */
  narratives: "/attention",
  /** Frozen top-nav alias — Narratives. */
  NARRATIVES: "/attention",
  /** Head-to-head narrative comparison tool. */
  narrativeWars: "/narrative-wars",
  NARRATIVE_WARS: "/narrative-wars",
  /** Frozen top-nav alias — Wars. */
  wars: "/narrative-wars",
  WARS: "/narrative-wars",
  /** Live markets directory (marketing shell). */
  discover: "/discover",
  /** Primary exploration surface — dense grid, filters, infinite scroll. */
  markets: "/markets",
  MARKETS: "/markets",
  market: (slug: string) => `/markets/${slug}`,
  MARKET_DETAIL: (slug: string) => `/markets/${slug}`,
  marketCreate: "/markets/create",
  MARKETS_CREATE: "/markets/create",
  /** @deprecated Use `marketsTrending` — `/trending` redirects there. */
  trending: "/trending",
  /** Live tape sort — pins recent fills to the top (`/markets?live=1`). */
  marketsTrending: "/markets?live=1",
  /** Full directory — primary Markets nav target. */
  marketsBrowse: "/markets",
  /** Community market submissions and voting. */
  marketsCommunity: "/markets/community",
  MARKETS_COMMUNITY: "/markets/community",
  /** Frozen top-nav alias — Community. */
  community: "/markets/community",
  COMMUNITY: "/markets/community",
  /**
   * Polymarket-style “Breaking” hub — OPEN markets with fresh live signals (`filter=breaking` on API).
   * Implemented as dedicated route so it is not rewritten by `/markets` canonical `trending` redirect.
   */
  marketsBreaking: "/markets/breaking",
  /** Route redirects to Portfolio (watchlist lives on Portfolio Section 9). */
  watchlist: "/watchlist",
  WATCHLIST: "/watchlist",
  /** Deep-link target for watchlist section after `/watchlist` redirect. */
  portfolioWatchlist: "/portfolio#watchlist",
  portfolio: "/portfolio",
  PORTFOLIO: "/portfolio",
  /** Signed-in user overview (not operator admin). */
  userDashboard: "/dashboard",
  activity: "/activity",
  /** Historical attention, volume, and resolved-market analytics. */
  analytics: "/analytics",
  ANALYTICS: "/analytics",
  leaderboard: "/leaderboard",
  /** Frozen top-nav alias — Leaderboard. */
  LEADERBOARD: "/leaderboard",
  wallet: "/wallet",
  profile: "/profile",
  PROFILE: (address: string) => `/profile/${encodeURIComponent(address)}`,
  traderProfile: (address: string) =>
    `/profile/${encodeURIComponent(address)}`,
  narrativeDetail: (slug: string) => `/narratives/${encodeURIComponent(slug)}`,
  NARRATIVE_DETAIL: (slug: string) => `/narratives/${encodeURIComponent(slug)}`,

  /* Settings (nested layout) */
  settings: "/settings",
  settingsTrading: "/settings/trading",
  settingsNotifications: "/settings/notifications",
  settingsAppearance: "/settings/appearance",
  settingsSecurity: "/settings/security",

  /* Auth (under (auth) layout group) */
  signIn: "/sign-in",

  /* Blockchain connect funnel — own protected layout */
  blockchainConnect: "/blockchain/connect",
  blockchainProtected: "/blockchain/protected",

  /* Operator console — own admin layout */
  adminLogin: "/admin/login",
  ADMIN: "/admin",
  adminDashboard: "/admin/dashboard",
  adminMarkets: "/admin/markets",
  ADMIN_MARKETS: "/admin/markets",
  adminConfig: "/admin/config",
  ADMIN_CONFIG: "/admin/config",

  /* Legacy → permanent redirect to /activity */
  pulse: "/pulse",
} as const;

/** Valid `feed=` values for `/markets` explorer preset rail (canonical share links). */
export type MarketsExplorerFeedPreset = "cross_hot";

/**
 * Canonical `/markets` URL with explorer feed preset (`trending=0` + `feed=`).
 */
export function marketsExplorerFeedUrl(preset: MarketsExplorerFeedPreset): string {
  const q = new URLSearchParams();
  q.set("feed", preset);
  return `${ROUTES.markets}?${q.toString()}`;
}
