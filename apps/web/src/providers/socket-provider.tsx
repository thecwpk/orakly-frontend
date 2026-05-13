"use client";

import type { ReactNode } from "react";
import { SocketRegistryProvider } from "@/websocket/socket-registry";

export function SocketProvider({
  children,
  portfolioUserId,
}: {
  children: ReactNode;
  portfolioUserId?: string | null;
}) {
  return (
    <SocketRegistryProvider portfolioUserId={portfolioUserId}>
      {children}
    </SocketRegistryProvider>
  );
}
