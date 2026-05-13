import { apiClient } from "@/api/client/http-client";
import { unwrapApiResult } from "../unwrap";
import { tradingActorHeaders } from "./trading-headers";

export type WalletOnChainSyncApiResult =
  | {
      ok: true;
      skipped: true;
      reason: "NO_RPC_CONFIG" | "NO_WALLET_ADDRESS" | "COOLDOWN";
    }
  | {
      ok: true;
      skipped: false;
      chainId: number;
      blockNumber: string;
      rows: number;
    };

/** POST `/api/v1/wallet/onchain/sync` — multicall refresh into Postgres. */
export async function postWalletOnChainSync(
  force = false,
): Promise<WalletOnChainSyncApiResult> {
  const res = await apiClient.request<WalletOnChainSyncApiResult>(
    "/api/v1/wallet/onchain/sync",
    {
      method: "POST",
      headers: {
        ...tradingActorHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ force }),
    },
  );
  return unwrapApiResult(res);
}
