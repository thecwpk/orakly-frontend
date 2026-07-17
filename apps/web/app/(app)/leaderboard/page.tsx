import type { Metadata } from "next";
import { LeaderboardPage } from "@/widgets/leaderboard/leaderboard-page";

export const metadata: Metadata = {
  title: "Leaderboard: Orakly",
  description: "Top traders and creators ranked by volume, accuracy, profit, and fees on Orakly.",
};

export default function LeaderboardRoute() {
  return <LeaderboardPage />;
}
