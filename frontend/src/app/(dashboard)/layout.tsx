import { ReactNode } from "react";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { OrganizationGate } from "@/components/layout/OrganizationGate";
import { TopBar } from "@/components/layout/TopBar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <TopBar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        <OrganizationGate>{children}</OrganizationGate>
      </main>
    </AuthGuard>
  );
}
