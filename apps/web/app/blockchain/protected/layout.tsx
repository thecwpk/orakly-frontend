import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { resolveWalletSessionFromCookies } from "@/server/wallet-auth/resolve-wallet-session";

export default async function ProtectedBlockchainLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await resolveWalletSessionFromCookies();

  if (!session) {
    redirect("/blockchain/connect?next=/blockchain/protected");
  }

  return children;
}
