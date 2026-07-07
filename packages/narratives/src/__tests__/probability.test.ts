import { describe, expect, it } from "vitest";
import { stabilizeProbability, VIRTUAL_LIQUIDITY_USDT } from "../engines/marketMaker.service.js";

describe("probability update", () => {
  it("stabilizeProbability pulls low-volume markets toward 0.5", () => {
    const raw = 0.9;
    const smoothed = stabilizeProbability(raw, 10);
    const expected =
      (raw * 10 + 0.5 * VIRTUAL_LIQUIDITY_USDT) / (10 + VIRTUAL_LIQUIDITY_USDT);

    expect(smoothed).toBeCloseTo(expected, 8);
    expect(smoothed).toBeLessThan(raw);
    expect(smoothed).toBeGreaterThan(0.5);
  });

  it("stabilizeProbability converges to raw probability at high volume", () => {
    const raw = 0.72;
    const smoothed = stabilizeProbability(raw, 1_000_000);
    expect(smoothed).toBeCloseTo(raw, 3);
  });

  it("stabilizeProbability output stays within [0,1]", () => {
    expect(stabilizeProbability(0.9, 100)).toBeLessThanOrEqual(1);
    expect(stabilizeProbability(0.9, 100)).toBeGreaterThanOrEqual(0);
    expect(stabilizeProbability(0.1, 100)).toBeLessThanOrEqual(1);
    expect(stabilizeProbability(0.1, 100)).toBeGreaterThanOrEqual(0);
  });
});
