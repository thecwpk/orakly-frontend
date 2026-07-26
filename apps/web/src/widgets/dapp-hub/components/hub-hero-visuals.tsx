"use client";

import { motion } from "framer-motion";

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
          stroke="color-mix(in srgb, var(--hub-fg) 10%, transparent)"
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
