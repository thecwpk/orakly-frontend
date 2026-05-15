/**
 * Canonical paths used across the app. Always import from here — never hardcode
 * a URL inline. When adding a route, update this map first; the navbar, the
 * settings sidebar, and feature CTAs all read from it.
 */
export const ROUTES = {
  /** Public marketing entry — landing at `/`. */
  home: "/",
  /** Same as `home` (legacy `/landing` URL redirects to `/`). */
  landing: "/",
  /** Trading hub home — live tape, spotlight lanes, browse blocks. */
  dapp: "/dapp",
  /** Live markets directory (marketing shell). */
  discover: "/discover",
  /** Primary exploration surface — dense grid, filters, infinite scroll. */
  markets: "/markets",
  market: (slug: string) => `/markets/${slug}`,
  marketCreate: "/markets/create",
  /** @deprecated Use `marketsTrending` — `/trending` redirects there. */
  trending: "/trending",
  /** Trending tape on the full markets directory. */
  marketsTrending: "/markets?trending=1",
  /** Full directory — trending filter off (“Markets” in primary nav). */
  marketsBrowse: "/markets?trending=0",
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
