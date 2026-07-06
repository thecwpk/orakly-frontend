import { apiClient } from "@/api/client/http-client";
import type { AttentionDashboardPayload } from "@/shared/contracts/attention-dashboard";
import type { AttentionRotationPayload } from "@/shared/contracts/attention-rotation";
import { unwrapApiResult } from "../unwrap";

export async function fetchAttentionDashboard(
  limit = 20,
): Promise<AttentionDashboardPayload> {
  const res = await apiClient.request<AttentionDashboardPayload>(
    `/api/v1/dashboard/attention?limit=${limit}`,
  );
  return unwrapApiResult(res);
}

export async function fetchAttentionRotation(): Promise<AttentionRotationPayload> {
  const res = await apiClient.request<AttentionRotationPayload>(
    "/api/v1/attention/rotation",
  );
  return unwrapApiResult(res);
}
