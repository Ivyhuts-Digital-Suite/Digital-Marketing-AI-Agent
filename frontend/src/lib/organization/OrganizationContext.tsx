"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

/**
 * Holds which of the user's real organizations (from GET /api/organizations,
 * backed by a real Organization/OrganizationMembership model - see
 * useOrganizations()) is currently selected, persisted locally so it
 * survives a reload. OrganizationGate is what actually resolves this from
 * the user's memberships (auto-selecting their only organization, or
 * letting them pick/create one) - this context is just the storage cell
 * every API call in the app reads from.
 */

export const ORGANIZATION_STORAGE_KEY = "dmai.organizationId";
const STORAGE_KEY = ORGANIZATION_STORAGE_KEY;

interface OrganizationContextValue {
  organizationId: string | null;
  setOrganizationId: (id: string) => void;
  clearOrganizationId: () => void;
}

const OrganizationContext = createContext<OrganizationContextValue | null>(null);

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const [organizationId, setOrganizationIdState] = useState<string | null>(null);

  // Deliberately synced from localStorage post-mount (not a lazy useState
  // initializer): this page is statically prerendered, so the server-
  // rendered HTML always has no organizationId. Reading localStorage in the
  // initializer would make the client's first render diverge from that
  // prerendered HTML and trigger a hydration mismatch.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- see comment above the effect
      if (stored) setOrganizationIdState(stored);
    } catch {
      // localStorage unavailable - organizationId simply starts unset for this session.
    }
  }, []);

  const setOrganizationId = useCallback((id: string) => {
    setOrganizationIdState(id);
    try {
      window.localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // ignore
    }
  }, []);

  const clearOrganizationId = useCallback(() => {
    setOrganizationIdState(null);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  const value = useMemo(
    () => ({ organizationId, setOrganizationId, clearOrganizationId }),
    [organizationId, setOrganizationId, clearOrganizationId]
  );

  return <OrganizationContext.Provider value={value}>{children}</OrganizationContext.Provider>;
}

export function useOrganization(): OrganizationContextValue {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error("useOrganization must be used within an OrganizationProvider");
  }
  return context;
}
