"use client";

import { GlobalMarketingNavbar } from "@/widgets/app-shell/components/global-marketing-navbar";

/** Landing `/welcome` — same chrome as the dApp; anchor links resolve on that page. */
export function MarketingNavbar() {
  return <GlobalMarketingNavbar variant="landing" />;
}
