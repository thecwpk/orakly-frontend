"use client";

import type { UserRole } from "../stores/auth.store";
import { useAuthStore } from "../stores/auth.store";

/** Client-only RBAC helper — reads `useAuthStore`. */
export function useRequireRole(allowed: UserRole | readonly UserRole[]): boolean {
  const role = useAuthStore((s) => s.role);
  const list = Array.isArray(allowed) ? allowed : [allowed];
  return list.includes(role);
}
