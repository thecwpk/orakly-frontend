import type { Metadata } from "next";
import { WatchlistPage } from "@/widgets/watchlist/watchlist-page";

export const metadata: Metadata = {
  title: "Watchlist — Orakly Market",
  description:
    "Your personal feed of starred prediction markets — odds, volume, resolution dates at a glance.",
};

export default function Page() {
  return <WatchlistPage />;
}
