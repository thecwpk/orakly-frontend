import { backendRequest } from "../backend-client";
import { unwrapApiResult } from "../unwrap";
import { tradingActorHeaders } from "./trading-headers";

export type NotificationDto = {
  id: string;
  kind: "FILL" | "SETTLE" | "ALERT" | "MENTION" | "SYSTEM";
  title: string;
  body: string;
  at: string;
  href: string | null;
  marketSlug: string | null;
  read: boolean;
};

export async function fetchNotifications(
  userId?: string,
): Promise<NotificationDto[]> {
  const sp = userId ? `?userId=${encodeURIComponent(userId)}` : "";
  const res = await backendRequest<NotificationDto[]>(
    `/notifications${sp}`,
    { headers: tradingActorHeaders() },
  );
  return unwrapApiResult(res);
}
