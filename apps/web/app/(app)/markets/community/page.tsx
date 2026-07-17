import type { Metadata } from "next";
import { CommunityMarketsPage } from "@/widgets/community-markets/community-markets-page";

export const metadata: Metadata = {
  title: "Community: Orakly",
  description:
    "Submit market ideas, vote on community suggestions, browse approved community markets, and see top creators on Orakly.",
};

export default function CommunityMarketsRoute() {
  return <CommunityMarketsPage />;
}
