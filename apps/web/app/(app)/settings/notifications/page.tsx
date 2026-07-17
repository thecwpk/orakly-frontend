import type { Metadata } from "next";
import { NotificationsSettingsPanel } from "@/widgets/settings/panels/notifications-panel";

export const metadata: Metadata = {
  title: "Notification settings: Orakly",
};

export default function NotificationSettingsRoute() {
  return <NotificationsSettingsPanel />;
}
