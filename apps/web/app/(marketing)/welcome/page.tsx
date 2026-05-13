import type { Metadata } from "next";
import { LandingPage } from "@/widgets/landing/landing-page";

export const metadata: Metadata = {
  title: "Orakly Market — Predict crypto narratives",
  description:
    "Trade YES and NO on crypto attention and narratives — transparent on-chain settlement and real-time probability markets.",
};

/** Marketing landing — narrative funnel with in-page anchors only. */
export default function WelcomePage() {
  return <LandingPage />;
}
