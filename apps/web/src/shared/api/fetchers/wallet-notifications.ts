import { apiClient } from "@/api/client/http-client";
import { unwrapApiResult } from "../unwrap";
import type { AppNotification } from "@/features/notifications/types";

export type NotificationsListDto = {
  notifications: AppNotification[];
  unreadCount: number;
};

export async function fetchWalletNotifications(input: {
  walletAddress: string;
  limit?: number;
}): Promise<NotificationsListDto> {
  const sp = new URLSearchParams({
    walletAddress: input.walletAddress,
    limit: String(input.limit ?? 20),
  });
  const res = await apiClient.request<NotificationsListDto>(
    `/api/v1/notifications?${sp.toString()}`,
  );
  return unwrapApiResult(res);
}

export async function markWalletNotificationsRead(input: {
  walletAddress: string;
  ids?: string[];
  markAll?: boolean;
}): Promise<{ updated: number; unreadCount: number }> {
  const res = await apiClient.request<{ updated: number; unreadCount: number }>(
    "/api/v1/notifications/read",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        walletAddress: input.walletAddress,
        ids: input.ids ?? [],
        markAll: input.markAll ?? false,
      }),
    },
  );
  return unwrapApiResult(res);
}
