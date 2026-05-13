import type { ApiErr, ApiOk } from "@/api/types";

export function ok<T>(data: T): ApiOk<T> {
  return { ok: true, data };
}

export function err(code: string, message: string): ApiErr {
  return { ok: false, error: { code, message } };
}
