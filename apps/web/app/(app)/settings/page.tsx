import type { Metadata } from "next";
import { GeneralSettingsPanel } from "@/widgets/settings/panels/general-panel";

export const metadata: Metadata = {
  title: "General settings: Orakly",
};

export default function GeneralSettingsRoute() {
  return <GeneralSettingsPanel />;
}
