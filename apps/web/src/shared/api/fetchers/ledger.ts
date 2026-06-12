import { backendRequest } from "../backend-client";
import { unwrapApiResult } from "../unwrap";
import { tradingActorHeaders } from "./trading-headers";

export type LedgerEntryDto = {
  id: string;
  userId: string;
  type: "DEPOSIT" | "WITHDRAW" | "TRADE" | "PNL" | "REFUND";
  amount: string;
  txHash: string | null;
  timestamp: string;
};

export async function fetchLedgerEntries(
  userId?: string,
  options?: { limit?: number; offset?: number },
): Promise<LedgerEntryDto[]> {
  const params = new URLSearchParams();
  if (userId) params.set("userId", userId);
  if (options?.limit != null) params.set("limit", String(options.limit));
  if (options?.offset != null) params.set("offset", String(options.offset));
  const q = params.toString();
  const res = await backendRequest<LedgerEntryDto[]>(
    `/ledger${q ? `?${q}` : ""}`,
    { headers: tradingActorHeaders() },
  );
  return unwrapApiResult(res);
}
