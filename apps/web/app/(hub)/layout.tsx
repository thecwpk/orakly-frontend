import type { ReactNode } from "react";

/**
 * `/` — public marketing landing (no dApp chrome). Trading surfaces live under `(app)` e.g. `/markets`.
 */
export default function HubLayout({ children }: { children: ReactNode }) {
  return children;
}
