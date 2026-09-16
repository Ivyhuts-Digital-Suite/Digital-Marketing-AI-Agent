"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, LogOut, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { cn } from "@/lib/utils/cn";
import { OrganizationSwitcher } from "./OrganizationSwitcher";

const NAV_ITEMS = [{ href: "/calendar", label: "Content Calendar", icon: CalendarDays }];

export function TopBar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href="/calendar" className="flex items-center gap-2 font-semibold text-foreground">
            <span className="flex size-8 items-center justify-center rounded-lg bg-brand text-brand-foreground">
              <Sparkles className="size-4" aria-hidden />
            </span>
            <span className="hidden sm:inline">Content Studio</span>
          </Link>

          <nav className="hidden items-center gap-1 sm:flex">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive ? "bg-brand-muted text-brand" : "text-foreground-muted hover:bg-surface-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="size-4" aria-hidden />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <OrganizationSwitcher />
          {user && (
            <div className="flex items-center gap-2 border-l border-border pl-3">
              <span className="hidden text-sm text-foreground-muted sm:inline">{user.name}</span>
              <button
                onClick={logout}
                className="flex size-8 items-center justify-center rounded-lg text-foreground-muted transition-colors hover:bg-surface-muted hover:text-foreground"
                title="Log out"
              >
                <LogOut className="size-4" aria-hidden />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
