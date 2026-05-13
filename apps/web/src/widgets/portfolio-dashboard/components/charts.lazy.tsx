"use client";

import dynamic from "next/dynamic";
import { ShimmerBox } from "@/shared/ui";

/**
 * Lazy boundaries for Recharts-powered panels.
 *
 * Recharts pulls a meaningful amount of code (D3 utils + every chart subtype
 * we touch). Splitting these into their own client chunks keeps the initial
 * portfolio dashboard payload small and the main thread idle while data is
 * fetching. Visual placeholders are dimensionally identical to the real
 * panels, so swapping in the chart causes zero CLS.
 */

export const RoiEquityChart = dynamic(
  () =>
    import("./roi-equity-chart").then((m) => ({
      default: m.RoiEquityChart,
    })),
  {
    ssr: false,
    loading: () => (
      <ShimmerBox
        className="min-h-[168px] rounded-lg ring-1 ring-white/[0.05]"
        tone="panel"
      />
    ),
  },
);

export const MarketExposurePanel = dynamic(
  () =>
    import("./market-exposure-panel").then((m) => ({
      default: m.MarketExposurePanel,
    })),
  {
    ssr: false,
    loading: () => (
      <ShimmerBox
        className="min-h-[200px] rounded-lg ring-1 ring-white/[0.05]"
        tone="panel"
      />
    ),
  },
);
