import type { WalletBalanceDto } from "./wallet-balance";
import { backendRequest } from "../backend-client";
import { unwrapApiResult } from "../unwrap";
import { tradingActorHeaders } from "./trading-headers";

export type WalletTransferResult = {
  userId: string;
  type: "DEPOSIT" | "WITHDRAW";
  amountUsd: string;
  txHash: string | null;
  balance: WalletBalanceDto;
};

export async function postWalletDeposit(input: {
  amountUsd: number;
  txHash?: string | null;
  userId?: string;
}): Promise<WalletTransferResult> {
  const sp = input.userId ? `?userId=${encodeURIComponent(input.userId)}` : "";
  const res = await backendRequest<WalletTransferResult>(
    `/wallet/deposit${sp}`,
    {
      method: "POST",
      headers: {
        ...tradingActorHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amountUsd: input.amountUsd,
        txHash: input.txHash ?? null,
      }),
    },
  );
  return unwrapApiResult(res);
}

export async function postWalletWithdraw(input: {
  amountUsd: number;
  txHash?: string | null;
  userId?: string;
}): Promise<WalletTransferResult> {
  const sp = input.userId ? `?userId=${encodeURIComponent(input.userId)}` : "";
  const res = await backendRequest<WalletTransferResult>(
    `/wallet/withdraw${sp}`,
    {
      method: "POST",
      headers: {
        ...tradingActorHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amountUsd: input.amountUsd,
        txHash: input.txHash ?? null,
      }),
    },
  );
  return unwrapApiResult(res);
}
