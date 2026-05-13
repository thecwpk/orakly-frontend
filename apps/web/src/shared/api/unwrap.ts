import type { ApiResult } from "@/api/types";

export class QueryApiError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "QueryApiError";
    this.code = code;
  }
}

export function unwrapApiResult<T>(result: ApiResult<T>): T {
  if (!result.ok) {
    throw new QueryApiError(result.error.code, result.error.message);
  }
  return result.data;
}
