import { ROUTES } from "@/shared/constants/routes";

export const mainNavigation = [
  { label: "Markets", href: ROUTES.discover },
  { label: "Portfolio", href: "/portfolio" },
  { label: "Leaderboard", href: "/leaderboard" },
] as const;
