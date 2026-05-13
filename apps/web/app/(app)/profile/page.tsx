import type { Metadata } from "next";
import { ProfilePage } from "@/widgets/profile/profile-page";

export const metadata: Metadata = {
  title: "Profile — Orakly",
  description:
    "Your public trader profile — equity curve, win rate, recent trades, and shareable URL.",
};

export default function ProfileRoute() {
  return <ProfilePage />;
}
