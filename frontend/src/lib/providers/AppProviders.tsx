"use client";

import { ReactNode } from "react";
import { AuthProvider } from "../auth/AuthContext";
import { OrganizationProvider } from "../organization/OrganizationContext";
import { QueryProvider } from "../query/QueryProvider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        <OrganizationProvider>{children}</OrganizationProvider>
      </AuthProvider>
    </QueryProvider>
  );
}
