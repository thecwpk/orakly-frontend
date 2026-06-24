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
  /** Attention dashboard — narrative momentum & matchups. */
  attention: "/attention",
  /** Live markets directory (marketing shell). */
  discover: "/discover",
  /** Primary exploration surface — dense grid, filters, infinite scroll. */
  markets: "/markets",
  market: (slug: string) => `/markets/${slug}`,
  marketCreate: "/markets/create",
  /** @deprecated Use `marketsTrending` — `/trending` redirects there. */
  trending: "/trending",
  /** Live tape sort — pins recent fills to the top (`/markets?live=1`). */
  marketsTrending: "/markets?live=1",
  /** Full directory — primary Markets nav target. */
  marketsBrowse: "/markets",
  /**
   * Polymarket-style “Breaking” hub — OPEN markets with fresh live signals (`filter=breaking` on API).
   * Implemented as dedicated route so it is not rewritten by `/markets` canonical `trending` redirect.
   */
  marketsBreaking: "/markets/breaking",
  watchlist: "/watchlist",
  portfolio: "/portfolio",
  /** Signed-in user overview (not operator admin). */
  userDashboard: "/dashboard",
  activity: "/activity",
  leaderboard: "/leaderboard",
  wallet: "/wallet",
  profile: "/profile",
  traderProfile: (address: string) =>
    `/profile/${encodeURIComponent(address)}`,

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
  adminDashboard: "/admin/dashboard",

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
