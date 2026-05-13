import type { ReactNode } from "react";
import { MinimalMarketShell } from "@/widgets/dapp-hub";

/**
 * `/` hub — same top bar + mobile dock as `(app)` (`MinimalMarketShell`), full-width markets canvas.
 */
export default function HubLayout({ children }: { children: ReactNode }) {
  return <MinimalMarketShell>{children}</MinimalMarketShell>;
}
