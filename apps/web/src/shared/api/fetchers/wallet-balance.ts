import { backendRequest } from "../backend-client";
import { unwrapApiResult } from "../unwrap";
import { tradingActorHeaders } from "./trading-headers";

export type WalletBalanceDto = {
  userId: string;
  availableBalanceUsd: string;
  lockedBalanceUsd: string;
  totalBalanceUsd: string;
  depositsUsd: string;
  withdrawalsUsd: string;
  openPositionsValueUsd: string;
  realizedPnlUsd: string;
};

export async function fetchWalletBalance(
  userId?: string,
): Promise<WalletBalanceDto> {
  const sp = userId ? `?userId=${encodeURIComponent(userId)}` : "";
  const res = await backendRequest<WalletBalanceDto>(
    `/wallet/balance${sp}`,
    { headers: tradingActorHeaders() },
  );
  return unwrapApiResult(res);
}
