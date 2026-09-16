import { getToken } from "../auth/tokenStore";
import { ApiError } from "./errors";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000";

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  /** Set true for endpoints that don't require the Authorization header (login/register). Every other request is authenticated by default. */
  skipAuth?: boolean;
}

/**
 * Single fetch wrapper every API module goes through - the one place that
 * knows the backend's base URL, attaches the JWT from tokenStore as
 * `Authorization: Bearer <token>` (matching backend/src/middleware/auth.middleware.ts
 * exactly), and normalizes every non-2xx response into an ApiError carrying
 * the real HTTP status so callers can branch on 401/403/404/409/503.
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, skipAuth = false } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (!skipAuth) {
    const token = getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("Could not reach the server. Check your connection and try again.", 0);
  }

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    const message =
      (payload && typeof payload === "object" && "message" in payload && typeof payload.message === "string"
        ? payload.message
        : null) ?? `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status);
  }

  return payload as T;
}
