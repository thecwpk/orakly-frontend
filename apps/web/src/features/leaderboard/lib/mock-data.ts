import type { LeaderboardWindow, Trader } from "./types";

/* ---------------------------------------------------------------- */
/* Deterministic seed → produces stable mock data across reloads     */
/* ---------------------------------------------------------------- */

function hash(input: string): number {
  let h = 5381;
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) + h) ^ input.charCodeAt(i);
  }
  return h >>> 0;
}

function rng(seed: number): () => number {
  let s = seed || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

/* ---------------------------------------------------------------- */
/* Trader directory — same population across windows, scaled metrics  */
/* ---------------------------------------------------------------- */

type TraderSeed = {
  address: string;
  alias: string;
  /** Capital deployed baseline — drives volume + roi math. */
  base: number;
  /** Skill factor 0..1 — controls win rate + roi distribution. */
  skill: number;
};

const SEEDS: ReadonlyArray<TraderSeed> = [
  { address: "0xab12fe34c8ab21cd…7e4f", alias: "ConvexAlpha", base: 4_120_000, skill: 0.74 },
  { address: "0x9cc3a72f1d8a921e…21bd", alias: "MacroDelta", base: 6_810_000, skill: 0.66 },
  { address: "0xbfa419c2dd3aab02…aa01", alias: "OdinTrader", base: 1_980_000, skill: 0.81 },
  { address: "0x77af2c19be93d901…d901", alias: "MicrostructX", base: 9_240_000, skill: 0.6 },
  { address: "0xeefa110084221100…1100", alias: "BetaHunter", base: 2_100_000, skill: 0.7 },
  { address: "0x441b0099aaee3322…99ee", alias: "GammaSquid", base: 3_600_000, skill: 0.62 },
  { address: "0xa10c5511bb88ab44…5511", alias: "OracleSnipe", base: 1_240_000, skill: 0.78 },
  { address: "0xff320044ddccaabb…0044", alias: "LiquidityKnight", base: 5_010_000, skill: 0.58 },
  { address: "0x8d72ba1244cc0011…ba12", alias: "TermStructure", base: 870_000, skill: 0.82 },
  { address: "0xddeaabbccdd33221…aabb", alias: "MeanReverter", base: 4_400_000, skill: 0.55 },
  { address: "0x12c8aa55ff990033…5511", alias: "SkewSurfer", base: 720_000, skill: 0.69 },
  { address: "0x9911aa00ddee2244…2244", alias: "VarianceVault", base: 3_140_000, skill: 0.65 },
  { address: "0x55a1b2c3d4e5f607…0607", alias: "IsoTermAlpha", base: 612_000, skill: 0.71 },
  { address: "0xae29b14f3d801127…1127", alias: "EdgeFinder", base: 1_810_000, skill: 0.68 },
  { address: "0x60ff44aa1199cc77…cc77", alias: "RegimeShift", base: 2_440_000, skill: 0.6 },
  { address: "0x77b21288de9aa413…a413", alias: "AzimuthCap", base: 920_000, skill: 0.73 },
  { address: "0xfaab2200ccdd1133…1133", alias: "VolPriest", base: 5_540_000, skill: 0.56 },
  { address: "0xc2c1d4d3e1e0f0a0…f0a0", alias: "TickAttacker", base: 380_000, skill: 0.85 },
  { address: "0xee44aabbcc110099…0099", alias: "MarketWeaver", base: 1_120_000, skill: 0.62 },
  { address: "0x33dd99cc55aa11ff…11ff", alias: "Quark", base: 2_980_000, skill: 0.64 },
];

/* ---------------------------------------------------------------- */
/* Window scaling — bigger horizons yield bigger absolute numbers    */
/* ---------------------------------------------------------------- */

const WINDOW_SCALE: Record<LeaderboardWindow, number> = {
  "24h": 0.06,
  "7d": 0.32,
  "30d": 1,
  all: 4.6,
};

const WINDOW_SPARK_LEN: Record<LeaderboardWindow, number> = {
  "24h": 12,
  "7d": 14,
  "30d": 16,
  all: 16,
};

function buildSpark(rand: () => number, length: number, biasUp: boolean): number[] {
  const points: number[] = [];
  let v = 0.5 + rand() * 0.2;
  const drift = biasUp ? 0.018 : -0.012;
  for (let i = 0; i < length; i++) {
    v += drift + (rand() - 0.5) * 0.12;
    v = Math.max(0.02, Math.min(0.98, v));
    points.push(v);
  }
  return points;
}

/* ---------------------------------------------------------------- */
/* Public API                                                        */
/* ---------------------------------------------------------------- */

/** Produces a deterministic snapshot of traders for the given time window. */
export function buildTradersForWindow(window: LeaderboardWindow): Trader[] {
  const scale = WINDOW_SCALE[window];
  const sparkLen = WINDOW_SPARK_LEN[window];

  return SEEDS.map((seed) => {
    const rand = rng(hash(`${seed.address}:${window}`));

    /* Volume scales by base × window × jitter (0.6..1.4). */
    const volumeUsd = seed.base * scale * (0.6 + rand() * 0.8);

    /* PnL is volume × roi × edge. */
    const roiPct =
      (seed.skill - 0.5) * 28 + // skill component (positive when > 0.5)
      (rand() - 0.5) * 14; // noise

    const pnlUsd = volumeUsd * (roiPct / 100);

    /* Win rate roughly tracks skill but is bounded. */
    const winRatePct = Math.max(
      30,
      Math.min(94, seed.skill * 100 + (rand() - 0.5) * 20),
    );

    const trades = Math.max(8, Math.round((volumeUsd / 12_000) * (0.6 + rand() * 0.8)));
    const delta24h = (rand() - 0.45) * 12;
    const streak = Math.round(rand() * 11);

    return {
      address: seed.address,
      alias: seed.alias,
      pnlUsd,
      volumeUsd,
      winRatePct,
      roiPct,
      trades,
      delta24h,
      streak,
      spark: buildSpark(rand, sparkLen, pnlUsd >= 0),
    };
  });
}

/** Window-level aggregates surfaced in the KPI strip. */
export function summarizeTraders(traders: ReadonlyArray<Trader>): {
  totalVolumeUsd: number;
  totalPnlUsd: number;
  averageWinRate: number;
  totalTrades: number;
} {
  if (traders.length === 0) {
    return { totalVolumeUsd: 0, totalPnlUsd: 0, averageWinRate: 0, totalTrades: 0 };
  }
  let v = 0;
  let p = 0;
  let w = 0;
  let t = 0;
  for (const tr of traders) {
    v += tr.volumeUsd;
    p += tr.pnlUsd;
    w += tr.winRatePct;
    t += tr.trades;
  }
  return {
    totalVolumeUsd: v,
    totalPnlUsd: p,
    averageWinRate: w / traders.length,
    totalTrades: t,
  };
}
