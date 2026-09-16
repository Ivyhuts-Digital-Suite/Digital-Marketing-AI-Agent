import { apiRequest } from "./client";
import {
  ContentPlanWithItemsResponse,
  FinalizeContentPlanResponse,
  GenerateContentPlanInput,
  GenerateContentPlanResponse,
  ListContentPlansResponse,
} from "./types";

export function generateContentPlan(input: GenerateContentPlanInput): Promise<GenerateContentPlanResponse> {
  return apiRequest<GenerateContentPlanResponse>("/api/content-intelligence/plans", {
    method: "POST",
    body: input,
  });
}

export function getContentPlans(organizationId: string): Promise<ListContentPlansResponse> {
  return apiRequest<ListContentPlansResponse>(`/api/content-intelligence/plans/${organizationId}`);
}

export function getContentPlan(organizationId: string, planId: string): Promise<ContentPlanWithItemsResponse> {
  return apiRequest<ContentPlanWithItemsResponse>(`/api/content-intelligence/plans/${organizationId}/${planId}`);
}

export function finalizeContentPlan(organizationId: string, planId: string): Promise<FinalizeContentPlanResponse> {
  return apiRequest<FinalizeContentPlanResponse>(`/api/content-intelligence/plans/${planId}/finalize`, {
    method: "POST",
    body: { organizationId },
  });
}
