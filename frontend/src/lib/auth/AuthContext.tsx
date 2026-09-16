"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as authApi from "../api/auth";
import { AuthUser } from "../api/types";
import { clearToken, getToken, setToken } from "./tokenStore";
import { ORGANIZATION_STORAGE_KEY } from "../organization/OrganizationContext";

/** Clears the persisted organization selection too - it belongs to whichever user was logged in, and must never leak to whoever logs in next on this browser. */
function clearPersistedOrganizationSelection(): void {
  try {
    window.localStorage.removeItem(ORGANIZATION_STORAGE_KEY);
  } catch {
    // ignore
  }
}

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);

  // Deliberately checked post-mount, not via a lazy useState initializer:
  // this page is statically prerendered (no window on the server), so
  // reading the token during render would diverge from the prerendered
  // HTML and trigger a hydration mismatch.
  useEffect(() => {
    const existingToken = getToken();
    if (!existingToken) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- see comment above the effect
      setStatus("unauthenticated");
      return;
    }

    authApi
      .getCurrentUser()
      .then((response) => {
        setUser(response.user);
        setStatus("authenticated");
      })
      .catch(() => {
        clearToken();
        clearPersistedOrganizationSelection();
        setUser(null);
        setStatus("unauthenticated");
      });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await authApi.login(email, password);
    // A previous session on this browser may have left a different user's
    // organization selected - never carry that into a fresh login.
    // OrganizationGate re-resolves it from this user's real memberships.
    clearPersistedOrganizationSelection();
    setToken(response.token);
    setUser(response.user);
    setStatus("authenticated");
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    await authApi.register(name, email, password);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    clearPersistedOrganizationSelection();
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  const value = useMemo(() => ({ status, user, login, register, logout }), [status, user, login, register, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
