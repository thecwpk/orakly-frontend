import type { Metadata } from "next";
import { TradingSettingsPanel } from "@/widgets/settings/panels/trading-panel";

export const metadata: Metadata = {
  title: "Trading settings — Orakly",
};

export default function TradingSettingsRoute() {
  return <TradingSettingsPanel />;
}
