import { apiRequest } from "./client";
import { CreateOrganizationInput, CreateOrganizationResponse, ListOrganizationsResponse } from "./types";

export function getOrganizations(): Promise<ListOrganizationsResponse> {
  return apiRequest<ListOrganizationsResponse>("/api/organizations");
}

export function createOrganization(input: CreateOrganizationInput): Promise<CreateOrganizationResponse> {
  return apiRequest<CreateOrganizationResponse>("/api/organizations", {
    method: "POST",
    body: input,
  });
}
