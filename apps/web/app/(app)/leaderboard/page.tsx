import type { Metadata } from "next";
import { LeaderboardPage } from "@/widgets/leaderboard/leaderboard-page";

export const metadata: Metadata = {
  title: "Leaderboard — Orakly",
  description:
    "Top traders ranked by realized PnL, volume, and win rate across rolling time windows.",
};

export default function LeaderboardRoute() {
  return <LeaderboardPage />;
}
