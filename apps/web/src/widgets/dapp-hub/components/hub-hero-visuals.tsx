"use client";

import { motion } from "framer-motion";

/** Ambient desk atmosphere — glows, grid candles, floating markers. */
export function HubHeroVisuals() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="hub-glow-purple -left-20 top-0 h-72 w-72" />
      <div className="hub-glow-blue right-[-10%] top-16 h-80 w-80" />
      <div className="hub-glow-purple bottom-0 right-1/3 h-48 w-48 opacity-40" />

      {/* Soft particle field */}
      <svg className="absolute inset-0 h-full w-full opacity-40" aria-hidden>
        {[
          [12, 18],
          [28, 42],
          [55, 14],
          [72, 36],
          [88, 22],
          [18, 68],
          [44, 78],
          [66, 62],
          [82, 74],
          [35, 52],
        ].map(([x, y], i) => (
          <motion.circle
            key={`${x}-${y}`}
            cx={`${x}%`}
            cy={`${y}%`}
            r={i % 3 === 0 ? 1.6 : 1.1}
            fill={i % 2 === 0 ? "#7c5cfc" : "#00d4aa"}
            animate={{ opacity: [0.15, 0.55, 0.15], y: [0, -4, 0] }}
            transition={{
              duration: 3.2 + (i % 4) * 0.7,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.12,
            }}
          />
        ))}
      </svg>

      <CandlestickSilhouette />
    </div>
  );
}

function CandlestickSilhouette() {
  return (
    <svg
      viewBox="0 0 400 120"
      className="absolute inset-x-0 bottom-0 h-32 w-full opacity-[0.16]"
      preserveAspectRatio="none"
      aria-hidden
    >
      {[20, 45, 70, 95, 120, 145, 170, 195, 220, 245, 270, 295, 320, 345, 370].map(
        (x, i) => {
          const h = 18 + (i % 5) * 14;
          const y = 58 - h / 2 + (i % 3) * 6;
          const up = i % 2 === 0;
          return (
            <g key={x}>
              <line
                x1={x}
                y1={y - 10}
                x2={x}
                y2={y + h + 10}
                stroke={up ? "#00d4aa" : "#ff5c5c"}
                strokeWidth="1"
              />
              <rect
                x={x - 6}
                y={y}
                width={12}
                height={h}
                rx={1}
                fill={up ? "#00d4aa" : "#ff5c5c"}
                opacity="0.9"
              />
            </g>
          );
        },
      )}
    </svg>
  );
}

/** Large YES probability ring — graphical centerpiece for featured market. */
export function HubProbRing({
  yesPct,
  size = 168,
}: {
  yesPct: number;
  size?: number;
}) {
  const r = 58;
  const c = 2 * Math.PI * r;
  const clamped = Math.min(100, Math.max(0, yesPct));
  const dash = (clamped / 100) * c;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90" aria-hidden>
        <defs>
          <linearGradient id="hub-prob-yes" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#00d4aa" />
            <stop offset="100%" stopColor="#7c5cfc" />
          </linearGradient>
          <filter id="hub-prob-glow">
            <feGaussianBlur stdDeviation="2.5" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle
          cx="70"
          cy="70"
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="10"
        />
        <motion.circle
          cx="70"
          cy="70"
          r={r}
          fill="none"
          stroke="url(#hub-prob-yes)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          filter="url(#hub-prob-glow)"
          initial={{ strokeDasharray: `0 ${c}` }}
          animate={{ strokeDasharray: `${dash} ${c}` }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--hub-muted)]">
          YES
        </span>
        <span className="mt-0.5 text-3xl font-extrabold tabular-nums tracking-tight text-[var(--hub-fg)]">
          {Math.round(clamped)}%
        </span>
      </div>
    </div>
  );
}
