import { redirect } from "next/navigation";
import { ROUTES } from "@/shared/constants/routes";

/** Watchlist is Portfolio Section 9 — keep `/watchlist` reachable via redirect. */
export default function WatchlistRedirectPage() {
  redirect(ROUTES.portfolio);
}
