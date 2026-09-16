"use client";

import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { Building2, Loader2 } from "lucide-react";
import { useOrganization } from "@/lib/organization/OrganizationContext";
import { useCreateOrganization, useOrganizations } from "@/lib/hooks/useOrganizations";
import { isApiError } from "@/lib/api/errors";
import { Organization } from "@/lib/api/types";
import { Button } from "../ui/Button";
import { Card, CardContent } from "../ui/Card";
import { ErrorState } from "../ui/ErrorState";
import { Field, Input } from "../ui/Field";

function CreateOrganizationForm({ onCreated }: { onCreated: (organizationId: string) => void }) {
  const createOrganization = useCreateOrganization();
  const [name, setName] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    const response = await createOrganization.mutateAsync({ name: trimmed });
    onCreated(response.data._id);
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-3 text-left">
      <Field label="Organization name" htmlFor="organizationName">
        <Input
          id="organizationName"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. Acme Inc."
          required
        />
      </Field>
      {createOrganization.error && (
        <p className="text-xs text-danger">
          {isApiError(createOrganization.error) ? createOrganization.error.message : "Failed to create organization."}
        </p>
      )}
      <Button type="submit" className="w-full" isLoading={createOrganization.isPending}>
        Create Organization
      </Button>
    </form>
  );
}

function OrganizationPicker({ organizations, onSelect }: { organizations: Organization[]; onSelect: (id: string) => void }) {
  return (
    <div className="flex w-full flex-col gap-2 text-left">
      {organizations.map((organization) => (
        <button
          key={organization._id}
          onClick={() => onSelect(organization._id)}
          className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3 text-left text-sm transition-colors hover:border-brand/40 hover:bg-brand-muted"
        >
          <span className="font-medium text-foreground">{organization.name}</span>
          <span className="text-xs capitalize text-foreground-muted">{organization.role}</span>
        </button>
      ))}
    </div>
  );
}

/**
 * Blocks dashboard content until an organizationId is selected. Never asks
 * for a raw MongoDB id - it fetches the organizations the authenticated
 * user actually belongs to (GET /api/organizations) and either auto-selects
 * the only one, lets the user pick among several, or offers to create one.
 */
export function OrganizationGate({ children }: { children: ReactNode }) {
  const { organizationId, setOrganizationId } = useOrganization();
  const organizationsQuery = useOrganizations();
  const organizations = useMemo(() => organizationsQuery.data ?? [], [organizationsQuery.data]);

  // Auto-select the user's only organization. This only ever fires once
  // (guarded by `!organizationId`), syncing local/persisted selection state
  // to match fetched server data - not something that can be computed
  // inline, since it also needs to persist to localStorage.
  useEffect(() => {
    if (!organizationId && organizations.length === 1) {
      setOrganizationId(organizations[0]._id);
    }
  }, [organizationId, organizations, setOrganizationId]);

  // Fast path: already have a selection, never block navigation on refetching the org list.
  if (organizationId) {
    return <>{children}</>;
  }

  if (organizationsQuery.isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-brand" aria-hidden />
      </div>
    );
  }

  if (organizationsQuery.isError) {
    return (
      <ErrorState
        message={isApiError(organizationsQuery.error) ? organizationsQuery.error.message : "Failed to load your organizations."}
      />
    );
  }

  const title = organizations.length === 0 ? "No organization yet" : "Choose an organization";
  const description =
    organizations.length === 0
      ? "Create an organization to start planning and generating content."
      : "Select which organization you'd like to work in.";

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center gap-4 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-brand-muted text-brand">
            <Building2 className="size-6" aria-hidden />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-foreground">{title}</h2>
            <p className="text-sm text-foreground-muted">{description}</p>
          </div>

          {organizations.length > 0 && <OrganizationPicker organizations={organizations} onSelect={setOrganizationId} />}
          {organizations.length === 0 && <CreateOrganizationForm onCreated={setOrganizationId} />}
        </CardContent>
      </Card>
    </div>
  );
}
