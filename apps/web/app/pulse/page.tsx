import { permanentRedirect } from "next/navigation";

/**
 * `/pulse` was the legacy home for the live tape + statistics + leaderboard.
 * The router has since split this into:
 *   /activity   → live tape + platform statistics
 *   /leaderboard → standalone trader rankings
 *
 * Permanent redirect preserves any external links and SEO equity.
 */
export default function PulseRedirect() {
  permanentRedirect("/activity");
}
