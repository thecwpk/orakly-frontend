"use client";

import { GlobalMarketingNavbar } from "@/widgets/app-shell/components/global-marketing-navbar";

/** Marketing entry at `/` — anchor links resolve on that page. Use `chrome="glass"` inside the premium hero. */
export function MarketingNavbar({ chrome = "default" }: { chrome?: "default" | "glass" }) {
  return <GlobalMarketingNavbar variant="landing" chrome={chrome} />;
}
