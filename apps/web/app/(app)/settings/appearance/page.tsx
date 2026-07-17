import type { Metadata } from "next";
import { AppearanceSettingsPanel } from "@/widgets/settings/panels/appearance-panel";

export const metadata: Metadata = {
  title: "Appearance: Orakly",
};

export default function AppearanceSettingsRoute() {
  return <AppearanceSettingsPanel />;
}
