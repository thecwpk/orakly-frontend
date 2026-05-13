import type { ReactNode } from "react";
import { SettingsShell } from "@/widgets/settings/components/settings-shell";

/**
 * Nested layout for /settings/*. Renders the sticky settings sidebar on the
 * left and slots child pages on the right. Each child page only ships its
 * panel content, so navigation between settings tabs is instant — only the
 * panel re-renders.
 */
export default function SettingsLayout({ children }: { children: ReactNode }) {
  return <SettingsShell>{children}</SettingsShell>;
}
