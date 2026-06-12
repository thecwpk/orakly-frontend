import type { LedgerEntryDto } from "@/shared/api/fetchers/ledger";
import type { TradeRow } from "@/shared/api/fetchers/trades";
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
  ledger?: LedgerEntryDto[];
  userId: string | undefined;
  marketTitleById?: Map<string, string>;
  /** Optional cap on returned rows. */
  max?: number;
}): WalletTxRow[] {
  const { trades, ledger = [], userId, marketTitleById, max = 50 } = input;

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

  for (const entry of ledger) {
    const amount = parseUsd(entry.amount);
    const kind =
      entry.type === "DEPOSIT"
        ? "DEPOSIT"
        : entry.type === "WITHDRAW"
          ? "WITHDRAW"
          : entry.type === "TRADE"
            ? amount < 0
              ? "TRADE_BUY"
              : "TRADE_SELL"
            : entry.type === "PNL"
              ? "TRADE_SELL"
              : "DEPOSIT";
    rows.push({
      id: `l:${entry.id}`,
      kind,
      amountUsd: amount,
      label:
        entry.type === "DEPOSIT"
          ? "Deposit"
          : entry.type === "WITHDRAW"
            ? "Withdraw"
            : entry.type === "TRADE"
              ? "Trade"
              : entry.type === "PNL"
                ? "Settlement"
                : entry.type,
      reference: entry.txHash ?? undefined,
      status: "CONFIRMED",
      at: new Date(entry.timestamp).getTime(),
    });
  }

  rows.sort((a, b) => b.at - a.at);
  return rows.slice(0, max);
}
