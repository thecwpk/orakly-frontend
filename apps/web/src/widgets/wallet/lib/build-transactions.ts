import type { TradeRow } from "@/shared/api/fetchers/trades";
import type { WalletMovement } from "../store/wallet-movements-store";
import { parseUsd } from "./format";

export type WalletTxKind = "DEPOSIT" | "WITHDRAW" | "TRADE_BUY" | "TRADE_SELL";

export type WalletTxRow = {
  id: string;
  kind: WalletTxKind;
  amountUsd: number;
  /** Display label, e.g. `BTC ATH Q3`. */
  label: string;
  /** Internal ref (market id, tx hash, …). */
  reference?: string;
  status: "CONFIRMED" | "PENDING" | "FAILED";
  at: number;
};

/** Build a unified, time-sorted list of wallet txs from trades + local movements. */
export function buildWalletTransactions(input: {
  trades: TradeRow[];
  movements: WalletMovement[];
  userId: string | undefined;
  marketTitleById?: Map<string, string>;
  /** Optional cap on returned rows. */
  max?: number;
}): WalletTxRow[] {
  const { trades, movements, userId, marketTitleById, max = 50 } = input;

  const rows: WalletTxRow[] = [];

  for (const t of trades) {
    const buyer = userId && t.buyerId === userId;
    const seller = userId && t.sellerId === userId;
    if (!buyer && !seller) continue;

    const notional = t.notionalUsd === "pending" ? 0 : parseUsd(t.notionalUsd);
    const fee = parseUsd(buyer ? t.feeBuyerUsd : t.feeSellerUsd);
    const isBuySide = (buyer && t.side === "BUY") || (seller && t.side === "BUY");
    // A user buying = USD leaves wallet (negative).
    // A user selling = USD enters wallet (positive).
    const sign = isBuySide ? -1 : 1;
    const amount = sign * (notional + (sign < 0 ? fee : -fee));

    rows.push({
      id: `t:${t.id}`,
      kind: t.side === "BUY" ? "TRADE_BUY" : "TRADE_SELL",
      amountUsd: amount,
      label: marketTitleById?.get(t.marketId) ?? t.marketId.slice(0, 10) + "…",
      reference: t.marketId,
      status: t.optimistic ? "PENDING" : "CONFIRMED",
      at: new Date(t.executedAt).getTime(),
    });
  }

  for (const m of movements) {
    rows.push({
      id: `m:${m.id}`,
      kind: m.kind,
      amountUsd: m.kind === "DEPOSIT" ? m.amountUsd : -m.amountUsd,
      label: m.kind === "DEPOSIT" ? "Deposit" : "Withdraw",
      reference: m.hash,
      status: m.status,
      at: new Date(m.at).getTime(),
    });
  }

  rows.sort((a, b) => b.at - a.at);
  return rows.slice(0, max);
}
