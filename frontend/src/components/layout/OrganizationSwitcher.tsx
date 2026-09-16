"use client";

import { useState } from "react";
import { Building2, ChevronDown } from "lucide-react";
import { useOrganization } from "@/lib/organization/OrganizationContext";
import { useOrganizations } from "@/lib/hooks/useOrganizations";
import { cn } from "@/lib/utils/cn";

/** Shows the current organization and, when the user belongs to more than one, a dropdown to switch between real organizations - never a raw id. */
export function OrganizationSwitcher() {
  const { organizationId, setOrganizationId } = useOrganization();
  const organizationsQuery = useOrganizations();
  const [isOpen, setIsOpen] = useState(false);

  const organizations = organizationsQuery.data ?? [];
  const current = organizations.find((organization) => organization._id === organizationId);

  if (organizations.length <= 1) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-foreground-muted">
        <Building2 className="size-3.5 shrink-0" aria-hidden />
        <span className="max-w-[10rem] truncate">{current?.name ?? "—"}</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen((value) => !value)}
        className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-foreground-muted transition-colors hover:border-brand/40 hover:text-foreground"
      >
        <Building2 className="size-3.5 shrink-0" aria-hidden />
        <span className="max-w-[10rem] truncate">{current?.name ?? "Select organization"}</span>
        <ChevronDown className={cn("size-3 shrink-0 transition-transform", isOpen && "rotate-180")} aria-hidden />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-20 mt-1 w-56 overflow-hidden rounded-lg border border-border bg-surface shadow-lg">
          {organizations.map((organization) => (
            <button
              key={organization._id}
              onClick={() => {
                setOrganizationId(organization._id);
                setIsOpen(false);
              }}
              className={cn(
                "flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors hover:bg-brand-muted",
                organization._id === organizationId ? "bg-brand-muted text-brand" : "text-foreground"
              )}
            >
              <span className="truncate">{organization.name}</span>
              <span className="shrink-0 text-xs capitalize text-foreground-muted">{organization.role}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
