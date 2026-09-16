/**
 * Single source of truth for the JWT issued by POST /api/auth/login. Kept
 * outside React so the plain API client (lib/api/client.ts) can read it
 * without importing React context - AuthContext is a thin wrapper around
 * this for components that need to react to login/logout.
 */

const TOKEN_KEY = "dmai.auth.token";

type Listener = (token: string | null) => void;

const listeners = new Set<Listener>();

function readFromStorage(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

let cachedToken: string | null = readFromStorage();

export function getToken(): string | null {
  return cachedToken;
}

export function setToken(token: string): void {
  cachedToken = token;
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // localStorage unavailable (private mode, SSR) - the in-memory token still works for this session.
  }
  listeners.forEach((listener) => listener(token));
}

export function clearToken(): void {
  cachedToken = null;
  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
  listeners.forEach((listener) => listener(null));
}

export function subscribeToToken(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
