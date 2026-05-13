import type { Metadata } from "next";
import { ProfilePage } from "@/widgets/profile/profile-page";

type Params = { address: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { address } = await params;
  return {
    title: `Trader ${address.slice(0, 6)}… — Orakly`,
    description: `Public profile, equity curve, and trade history for ${address}.`,
  };
}

export default async function PublicProfileRoute({
  params,
}: {
  params: Promise<Params>;
}) {
  const { address } = await params;
  return <ProfilePage address={decodeURIComponent(address)} />;
}
