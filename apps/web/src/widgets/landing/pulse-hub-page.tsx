"use client";

import { LiveActivitySection } from "./sections/live-activity-section";
import { StatisticsSection } from "./sections/statistics-section";
import { TopTradersSection } from "./sections/top-traders-section";

export function PulseHubPage() {
  return (
    <main className="mx-auto flex max-w-6xl flex-col pb-s64 pt-s48 md:pb-s72 md:pt-s56">
      <div className="mb-s48 md:mb-s56">
        <LiveActivitySection />
      </div>
      <div className="mb-s56 md:mb-s64">
        <StatisticsSection />
      </div>
      <TopTradersSection />
    </main>
  );
}
