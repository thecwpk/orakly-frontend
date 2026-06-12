"use client";

import { useQuery } from "@tanstack/react-query";
import { CACHE_POLICY } from "../cache-policy";
import { fetchNotifications } from "../fetchers/notifications";
import { queryKeys } from "../query-keys";

export function useNotificationsQuery(userId: string | undefined) {
  return useQuery({
    queryKey: userId
      ? queryKeys.activity.notifications(userId)
      : [...queryKeys.activity.root(), "notifications", "__idle"],
    queryFn: () => fetchNotifications(userId),
    enabled: !!userId,
    ...CACHE_POLICY.activity,
  });
}
