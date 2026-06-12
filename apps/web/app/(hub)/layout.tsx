import type { ReactNode } from "react";

/**
 * `/` — redirects to `/dapp` (legacy `?trending=` queries still route to `/markets`).
 */
export default function HubLayout({ children }: { children: ReactNode }) {
  return children;
}
