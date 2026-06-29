import { Prisma } from "@prisma/client";

export const D0 = new Prisma.Decimal(0);
export const D1 = new Prisma.Decimal(1);
export const MIN_PRICE = new Prisma.Decimal("0.01");
export const MAX_PRICE = new Prisma.Decimal("0.99");

/** Resolution split: platform takes 75%, winning holders share 25% of `collateralPoolUsd`. */
export const PLATFORM_RESOLUTION_BPS = 7500;
export const WINNERS_RESOLUTION_BPS = 2500;
export const BPS_DENOMINATOR = 10_000;

export function toDec(v: string | number): Prisma.Decimal {
  return new Prisma.Decimal(typeof v === "number" ? v.toFixed(12) : v);
}

export function clampPrice(p: Prisma.Decimal): Prisma.Decimal {
  if (p.lessThan(MIN_PRICE)) return MIN_PRICE;
  if (p.greaterThan(MAX_PRICE)) return MAX_PRICE;
  return p;
}
