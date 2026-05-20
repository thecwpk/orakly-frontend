"use client";

/**
 * Global class names for hero (ml-*) and how-it-works (hw-*) animations.
 * Must be global so styles apply when sections live in separate modules.
 */
export function MarketingLandingKeyframes() {
  return (
    // eslint-disable-next-line react/no-unknown-property -- Next.js styled-jsx `jsx` / `global`
    <style jsx global>{`
      .ml-ambient-orb {
        animation: mlOrbFloat 9s ease-in-out infinite;
      }
      .ml-ambient-orb-delayed {
        animation: mlOrbFloat 11s ease-in-out infinite reverse;
        animation-delay: 1.4s;
      }
      .ml-grid-drift {
        animation: mlGridDrift 18s linear infinite;
      }
      .ml-preview-float {
        animation: mlCardFloat 6.5s ease-in-out infinite;
      }
      .ml-chart-shell {
        position: relative;
        overflow: hidden;
      }
      .ml-chart-shell::after {
        content: "";
        position: absolute;
        inset: -8% -40%;
        background: linear-gradient(
          100deg,
          transparent 20%,
          color-mix(in srgb, var(--yes) 22%, transparent) 50%,
          transparent 80%
        );
        opacity: 0.35;
        transform: translateX(-60%);
        animation: mlShimmer 3.6s ease-in-out infinite;
        pointer-events: none;
      }
      @keyframes mlOrbFloat {
        0%,
        100% {
          transform: translate3d(0, 0, 0) scale(1);
          opacity: 0.85;
        }
        50% {
          transform: translate3d(12px, -10px, 0) scale(1.04);
          opacity: 1;
        }
      }
      @keyframes mlGridDrift {
        0% {
          transform: translate3d(0, 0, 0);
        }
        100% {
          transform: translate3d(-20px, -14px, 0);
        }
      }
      @keyframes mlCardFloat {
        0%,
        100% {
          transform: translateY(0);
        }
        50% {
          transform: translateY(-6px);
        }
      }
      @keyframes mlShimmer {
        0% {
          transform: translateX(-65%);
        }
        60%,
        100% {
          transform: translateX(65%);
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .ml-ambient-orb,
        .ml-ambient-orb-delayed,
        .ml-grid-drift,
        .ml-preview-float,
        .ml-chart-shell::after {
          animation: none !important;
        }
      }

      .hw-cycle-wrap {
        position: relative;
        width: 100%;
        min-height: 440px;
        border-radius: 16px;
        border: none;
        background: transparent;
        overflow: hidden;
      }
      .hw-cycle-glass {
        position: absolute;
        inset: 50% auto auto 50%;
        width: min(78vw, 390px);
        height: min(78vw, 390px);
        border-radius: 999px;
        transform: translate(-50%, -50%);
        background: radial-gradient(circle, rgba(36, 48, 76, 0.24) 0%, rgba(13, 18, 32, 0.08) 55%, transparent 78%);
        border: 1px solid rgba(255, 255, 255, 0.06);
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.07), 0 22px 44px -34px rgba(0, 0, 0, 0.95);
        backdrop-filter: blur(5px);
      }
      .hw-cycle-ring {
        position: absolute;
        inset: 50% auto auto 50%;
        width: min(62vw, 320px);
        height: min(62vw, 320px);
        border-radius: 999px;
        border: 1px solid color-mix(in oklch, var(--border), transparent 20%);
        transform: translate(-50%, -50%);
      }
      .hw-cycle-ring::before {
        content: "";
        position: absolute;
        inset: -1px;
        border-radius: inherit;
        border: 2.5px solid transparent;
        border-top-color: color-mix(in srgb, var(--yes) 75%, white);
        border-right-color: color-mix(in srgb, var(--yes) 45%, transparent);
        filter: drop-shadow(0 0 10px color-mix(in srgb, var(--yes) 42%, transparent));
        animation: hwSpin 3.2s linear infinite;
      }
      .hw-cycle-core {
        position: absolute;
        inset: 50% auto auto 50%;
        width: 188px;
        transform: translate(-50%, -50%);
        text-align: center;
        border-radius: 0;
        border: none;
        background: transparent;
        padding: 10px 8px;
        animation: hwCorePulse 2.2s ease-in-out infinite;
      }
      .hw-node {
        position: absolute;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        color: hsl(var(--foreground));
        font-weight: 600;
        letter-spacing: 0.01em;
        z-index: 3;
        animation: hwNodeBob 3.2s ease-in-out infinite;
      }
      .hw-node-dot {
        width: 9px;
        height: 9px;
        border-radius: 999px;
        background: var(--yes);
        box-shadow: 0 0 0 6px color-mix(in srgb, var(--yes) 20%, transparent),
          0 0 18px color-mix(in srgb, var(--yes) 52%, transparent);
        animation: hwDotPulse 1.6s ease-in-out infinite;
      }
      .hw-node-label {
        display: inline-flex;
        flex-direction: column;
        gap: 1px;
        white-space: nowrap;
        color: hsl(var(--foreground) / 0.95);
        text-shadow: 0 0 12px rgba(0, 0, 0, 0.45);
        padding: 1px 4px;
        border-radius: 6px;
        background: color-mix(in oklch, hsl(var(--background)) 52%, transparent);
        border: 1px solid rgba(255, 255, 255, 0.06);
        box-shadow: 0 8px 24px -18px rgba(0, 0, 0, 0.8);
      }
      .hw-node-label strong {
        font-size: 10px;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: var(--muted-foreground);
      }
      .hw-node-label span {
        font-size: 12px;
        font-weight: 600;
      }
      .hw-node-0 {
        left: 50%;
        top: 18px;
        transform: translateX(-50%);
      }
      .hw-node-1 {
        right: 10px;
        top: 50%;
        transform: translateY(-50%);
      }
      .hw-node-2 {
        left: 50%;
        bottom: 18px;
        transform: translateX(-50%);
      }
      .hw-node-3 {
        left: 10px;
        top: 50%;
        transform: translateY(-50%);
      }
      .hw-step {
        position: relative;
        overflow: hidden;
        transition: border-color 0.22s ease, transform 0.22s ease, box-shadow 0.22s ease;
        animation: hwStepGlow 4.2s ease-in-out infinite;
      }
      .hw-step::after {
        content: "";
        position: absolute;
        inset: 0;
        pointer-events: none;
        background: linear-gradient(
          100deg,
          transparent 15%,
          color-mix(in srgb, var(--yes) 10%, transparent) 45%,
          transparent 75%
        );
        transform: translateX(-85%);
        animation: hwSweep 4.6s ease-in-out infinite;
      }
      .hw-step:hover {
        border-color: color-mix(in srgb, var(--yes) 24%, var(--border));
        transform: translateY(-1px);
        box-shadow: 0 14px 36px -26px rgba(0, 0, 0, 0.75);
      }
      .wo-metric-glow {
        animation: woMetricGlow 3.8s ease-in-out infinite;
      }
      @keyframes hwSpin {
        to {
          transform: rotate(360deg);
        }
      }
      @keyframes hwCorePulse {
        0%,
        100% {
          transform: translate(-50%, -50%) scale(1);
          text-shadow: 0 0 0 rgba(0, 0, 0, 0);
        }
        50% {
          transform: translate(-50%, -50%) scale(1.06);
          text-shadow: 0 0 18px color-mix(in srgb, var(--yes) 35%, transparent);
        }
      }
      @keyframes hwNodeBob {
        0%,
        100% {
          transform: translateY(0);
        }
        50% {
          transform: translateY(-3px);
        }
      }
      .hw-node-0,
      .hw-node-2 {
        animation-name: hwNodeBobX;
      }
      @keyframes hwNodeBobX {
        0%,
        100% {
          transform: translateX(-50%);
        }
        50% {
          transform: translateX(-50%) translateY(-5px);
        }
      }
      .hw-node-1,
      .hw-node-3 {
        animation-name: hwNodeBobY;
      }
      @keyframes hwNodeBobY {
        0%,
        100% {
          transform: translateY(-50%);
        }
        50% {
          transform: translateY(-50%) translateX(4px);
        }
      }
      @keyframes hwDotPulse {
        0%,
        100% {
          filter: brightness(1);
        }
        50% {
          filter: brightness(1.25);
        }
      }
      @keyframes hwStepGlow {
        0%,
        100% {
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 0 0 rgba(0, 0, 0, 0);
        }
        50% {
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 18px 40px -28px color-mix(in srgb, var(--yes) 18%, transparent);
        }
      }
      @keyframes hwSweep {
        0% {
          transform: translateX(-85%);
        }
        45%,
        100% {
          transform: translateX(85%);
        }
      }
      @keyframes woMetricGlow {
        0%,
        100% {
          border-color: rgba(255, 255, 255, 0.06);
        }
        50% {
          border-color: color-mix(in srgb, var(--yes) 28%, transparent);
        }
      }

      .wo-trad-grid-drift {
        animation: woTradGridDrift 22s linear infinite;
      }
      .wo-trad-orb {
        animation: woTradOrb 8s ease-in-out infinite;
      }
      .wo-trad-stale-badge {
        animation: woTradStalePulse 2.8s ease-in-out infinite;
      }
      .wo-trad-frozen-odds {
        animation: woTradFrozen 3.2s ease-in-out infinite;
      }
      .wo-trad-row:nth-child(odd) {
        animation: woTradRowFade 4s ease-in-out infinite;
      }
      .wo-trad-spinner {
        animation: woTradSpin 1.4s linear infinite;
      }
      .wo-trad-progress-bar {
        animation: woTradProgress 2.8s ease-in-out infinite;
      }
      .wo-trad-scan::after {
        content: "";
        position: absolute;
        inset: -20% 0;
        background: linear-gradient(
          180deg,
          transparent 0%,
          rgba(255, 255, 255, 0.03) 48%,
          transparent 100%
        );
        animation: woTradScan 5.5s ease-in-out infinite;
        pointer-events: none;
      }
      @keyframes woTradGridDrift {
        to {
          transform: translate3d(-12px, -8px, 0);
        }
      }
      @keyframes woTradOrb {
        0%,
        100% {
          opacity: 0.5;
          transform: translateY(0);
        }
        50% {
          opacity: 0.85;
          transform: translateY(-8px);
        }
      }
      @keyframes woTradStalePulse {
        0%,
        100% {
          border-color: rgba(113, 113, 122, 0.35);
          color: rgb(113 113 122);
        }
        50% {
          border-color: rgba(113, 113, 122, 0.55);
          color: rgb(161 161 170);
        }
      }
      @keyframes woTradFrozen {
        0%,
        100% {
          opacity: 0.55;
        }
        50% {
          opacity: 0.85;
        }
      }
      @keyframes woTradRowFade {
        0%,
        100% {
          background-color: transparent;
        }
        50% {
          background-color: rgba(255, 255, 255, 0.02);
        }
      }
      @keyframes woTradSpin {
        to {
          transform: rotate(360deg);
        }
      }
      @keyframes woTradProgress {
        0%,
        100% {
          width: 32%;
          opacity: 0.7;
        }
        50% {
          width: 41%;
          opacity: 1;
        }
      }
      @keyframes woTradScan {
        0% {
          transform: translateY(-100%);
        }
        100% {
          transform: translateY(100%);
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .hw-cycle-ring::before,
        .hw-cycle-core,
        .hw-node,
        .hw-step,
        .hw-step::after,
        .wo-metric-glow,
        .wo-trad-grid-drift,
        .wo-trad-orb,
        .wo-trad-stale-badge,
        .wo-trad-frozen-odds,
        .wo-trad-row,
        .wo-trad-spinner,
        .wo-trad-progress-bar,
        .wo-trad-scan::after {
          animation: none !important;
        }
      }
      @media (max-width: 1023px) {
        .hw-cycle-wrap {
          min-height: 390px;
        }
        .hw-cycle-glass {
          width: min(92vw, 340px);
          height: min(92vw, 340px);
        }
      }
    `}</style>
  );
}
