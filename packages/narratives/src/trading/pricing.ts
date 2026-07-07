import { Prisma } from "@prisma/client";
import { clampPrice, D1, toDec } from "./constants.js";

const IMPACT_CAP_LOCAL = toDec("0.06");

export function computeExecutionPrice(input: {
  side: "YES" | "NO";
  direction: "BUY" | "SELL";
  quantity: Prisma.Decimal;
  yesMid: Prisma.Decimal;
  liquidityUsd: Prisma.Decimal;
}): { execPrice: Prisma.Decimal; newYesMid: Prisma.Decimal } {
  const yesMid = clampPrice(input.yesMid);
  const noMid = clampPrice(D1.minus(yesMid));
  const depth = input.liquidityUsd.greaterThan(0)
    ? input.liquidityUsd
    : toDec(10_000);

  const rawImpact = input.quantity.div(depth.plus(input.quantity)).mul(toDec(0.04));
  const impact = rawImpact.greaterThan(IMPACT_CAP_LOCAL)
    ? IMPACT_CAP_LOCAL
    : rawImpact;

  let newYes = yesMid;
  if (input.side === "YES") {
    newYes =
      input.direction === "BUY"
        ? clampPrice(yesMid.plus(impact))
        : clampPrice(yesMid.minus(impact));
  } else {
    const moveNo =
      input.direction === "BUY"
        ? clampPrice(noMid.plus(impact))
        : clampPrice(noMid.minus(impact));
    newYes = clampPrice(D1.minus(moveNo));
  }

  const execYes =
    input.side === "YES"
      ? input.direction === "BUY"
        ? newYes
        : yesMid
      : input.direction === "BUY"
        ? clampPrice(D1.minus(newYes))
        : noMid;

  return {
    execPrice: clampPrice(execYes),
    newYesMid: newYes,
  };
}
