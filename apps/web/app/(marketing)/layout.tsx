import type { ReactNode } from "react";

/** Lightweight shell — no trading sidebar/topbar (marketing surfaces only). */
export default function MarketingGroupLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
