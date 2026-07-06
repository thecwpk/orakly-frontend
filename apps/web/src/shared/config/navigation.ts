import { ROUTES } from "@/shared/constants/routes";

export const mainNavigation = [
  { label: "Markets", href: ROUTES.marketsBrowse },
  { label: "Attention", href: ROUTES.attention },
  { label: "Analytics", href: ROUTES.analytics },
  { label: "Community", href: ROUTES.marketsCommunity },
  { label: "Narrative Wars", href: ROUTES.narrativeWars },
  { label: "Portfolio", href: ROUTES.portfolio },
  { label: "Leaderboard", href: ROUTES.leaderboard },
] as const;
