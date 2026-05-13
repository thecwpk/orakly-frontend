import { ROUTES } from "@/shared/constants/routes";

export const mainNavigation = [
  { label: "Markets", href: ROUTES.home },
  { label: "Portfolio", href: "/portfolio" },
  { label: "Leaderboard", href: "/leaderboard" },
] as const;
