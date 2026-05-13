import type { Metadata } from "next";
import { SecuritySettingsPanel } from "@/widgets/settings/panels/security-panel";

export const metadata: Metadata = {
  title: "Security — Orakly",
};

export default function SecuritySettingsRoute() {
  return <SecuritySettingsPanel />;
}
