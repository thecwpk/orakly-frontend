"use client";

export interface NarrativeRotationFlow {
  from: string;
  fromName: string;
  to: string;
  toName: string;
  magnitude: number;
  fromScore: number;
  toScore: number;
}

export interface NarrativeRotationRank {
  slug: string;
  name: string;
  delta: number;
  score: number;
}

export interface NarrativeRotationProps {
  flows: NarrativeRotationFlow[];
  gainers: NarrativeRotationRank[];
  losers: NarrativeRotationRank[];
}

const SVG_HEIGHT = 200;
const SVG_VIEW_WIDTH = 400;

function yForIndex(index: number, total: number): number {
  const padding = 28;
  if (total <= 1) return SVG_HEIGHT / 2;
  return padding + (index / (total - 1)) * (SVG_HEIGHT - padding * 2);
}

function mapMagnitude(magnitude: number, maxMagnitude: number) {
  const ratio = maxMagnitude > 0 ? magnitude / maxMagnitude : 0;
  return {
    strokeWidth: 1 + ratio * 5,
    opacity: 0.35 + ratio * 0.55,
  };
}

function formatDelta(delta: number, tone: "gain" | "loss"): string {
  const value = Math.abs(Math.round(delta));
  return tone === "gain" ? `+${value} pts` : `-${value} pts`;
}

function RotationEmptyState() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-6 py-10 text-center">
      <p className="text-sm text-gray-600">
        Not enough data to show rotation yet. Check back after more trading activity.
      </p>
    </div>
  );
}

function RankList({
  title,
  titleClassName,
  items,
  tone,
}: {
  title: string;
  titleClassName: string;
  items: NarrativeRotationRank[];
  tone: "gain" | "loss";
}) {
  const deltaClass = tone === "gain" ? "text-green-600" : "text-red-600";

  return (
    <div className="min-w-0">
      <h3 className={`mb-3 text-sm font-semibold ${titleClassName}`}>{title}</h3>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.slug} className="rounded-lg border border-gray-200 bg-white px-3 py-2">
            <p className="truncate text-sm font-semibold text-gray-900">{item.name}</p>
            <div className="mt-1 flex items-center justify-between gap-2 text-xs">
              <span className="font-medium text-gray-500">Score {Math.round(item.score)}</span>
              <span className={`font-semibold ${deltaClass}`}>{formatDelta(item.delta, tone)}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RotationFlowsSvg({
  flows,
  losers,
  gainers,
}: {
  flows: NarrativeRotationFlow[];
  losers: NarrativeRotationRank[];
  gainers: NarrativeRotationRank[];
}) {
  const maxMagnitude = Math.max(...flows.map((flow) => flow.magnitude), 1);

  return (
    <svg
      viewBox={`0 0 ${SVG_VIEW_WIDTH} ${SVG_HEIGHT}`}
      width="100%"
      height={SVG_HEIGHT}
      className="overflow-visible"
      aria-hidden
    >
      {flows.map((flow, index) => {
        const loserIndex = losers.findIndex((item) => item.slug === flow.from);
        const gainerIndex = gainers.findIndex((item) => item.slug === flow.to);
        const y1 = yForIndex(loserIndex >= 0 ? loserIndex : index, losers.length || flows.length);
        const y2 = yForIndex(gainerIndex >= 0 ? gainerIndex : index, gainers.length || flows.length);
        const { strokeWidth, opacity } = mapMagnitude(flow.magnitude, maxMagnitude);

        return (
          <path
            key={`${flow.from}-${flow.to}-${index}`}
            d={`M 80,${y1} C 200,${y1} 200,${y2} 320,${y2}`}
            stroke="#6366f1"
            fill="none"
            strokeWidth={strokeWidth}
            opacity={opacity}
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
}

export function NarrativeRotation({ flows, gainers, losers }: NarrativeRotationProps) {
  if (flows.length === 0) {
    return <RotationEmptyState />;
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(180px,1.2fr)_minmax(0,1fr)] lg:items-start">
      <RankList title="↓ Losing Attention" titleClassName="text-red-600" items={losers} tone="loss" />

      <div className="flex min-h-[200px] items-center rounded-xl border border-gray-200 bg-gray-50 px-2 py-3">
        <RotationFlowsSvg flows={flows} losers={losers} gainers={gainers} />
      </div>

      <RankList title="↑ Gaining Attention" titleClassName="text-green-600" items={gainers} tone="gain" />
    </div>
  );
}
