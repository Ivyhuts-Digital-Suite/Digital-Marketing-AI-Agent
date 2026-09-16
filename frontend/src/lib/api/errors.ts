/** Normalized error for every failed API call - carries the HTTP status so callers can branch on 401/403/404/409/503 etc. without re-parsing the response. */
export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
