import { apiRequest } from "./client";
import {
  ApproveContentInput,
  ContentLifecycleActionResponse,
  ContentStudioRequest,
  CreateCreativeBriefResponse,
  GenerateGraphicResponse,
  GenerateVideoResponse,
  GetContentAssetsResponse,
  GetContentHistoryResponse,
  GetCreativeBriefResponse,
  GetGenerationJobResponse,
  QualityCheckResponse,
  RequestChangesInput,
  ScheduleContentInput,
} from "./types";

export function generateCreativeBrief(input: ContentStudioRequest): Promise<CreateCreativeBriefResponse> {
  return apiRequest<CreateCreativeBriefResponse>("/api/content-studio/briefs", {
    method: "POST",
    body: input,
  });
}

/** Returns data: null (not an error) when no brief has been generated yet for this content item. */
export function getCreativeBrief(contentItemId: string): Promise<GetCreativeBriefResponse> {
  return apiRequest<GetCreativeBriefResponse>(`/api/content-studio/briefs/${contentItemId}`);
}

export function generateGraphic(input: ContentStudioRequest): Promise<GenerateGraphicResponse> {
  return apiRequest<GenerateGraphicResponse>("/api/content-studio/graphics/generate", {
    method: "POST",
    body: input,
  });
}

export function generateVideo(input: ContentStudioRequest): Promise<GenerateVideoResponse> {
  return apiRequest<GenerateVideoResponse>("/api/content-studio/videos/generate", {
    method: "POST",
    body: input,
  });
}

export function getContentAssets(contentItemId: string): Promise<GetContentAssetsResponse> {
  return apiRequest<GetContentAssetsResponse>(`/api/content-studio/assets/${contentItemId}`);
}

export function getGenerationJob(jobId: string): Promise<GetGenerationJobResponse> {
  return apiRequest<GetGenerationJobResponse>(`/api/content-studio/jobs/${jobId}`);
}

// ---------------------------------------------------------------------------
// Phase 9: lifecycle / review / scheduling
// ---------------------------------------------------------------------------

export function submitForReview(contentItemId: string): Promise<ContentLifecycleActionResponse> {
  return apiRequest<ContentLifecycleActionResponse>(`/api/content-studio/items/${contentItemId}/submit-review`, { method: "POST" });
}

export function approveContent(contentItemId: string, input: ApproveContentInput = {}): Promise<ContentLifecycleActionResponse> {
  return apiRequest<ContentLifecycleActionResponse>(`/api/content-studio/items/${contentItemId}/approve`, { method: "POST", body: input });
}

export function requestChanges(contentItemId: string, input: RequestChangesInput): Promise<ContentLifecycleActionResponse> {
  return apiRequest<ContentLifecycleActionResponse>(`/api/content-studio/items/${contentItemId}/request-changes`, {
    method: "POST",
    body: input,
  });
}

export function archiveContent(contentItemId: string, comment?: string): Promise<ContentLifecycleActionResponse> {
  return apiRequest<ContentLifecycleActionResponse>(`/api/content-studio/items/${contentItemId}/archive`, {
    method: "POST",
    body: { comment },
  });
}

export function scheduleContent(contentItemId: string, input: ScheduleContentInput): Promise<ContentLifecycleActionResponse> {
  return apiRequest<ContentLifecycleActionResponse>(`/api/content-studio/items/${contentItemId}/schedule`, {
    method: "POST",
    body: input,
  });
}

export function getContentHistory(contentItemId: string): Promise<GetContentHistoryResponse> {
  return apiRequest<GetContentHistoryResponse>(`/api/content-studio/items/${contentItemId}/history`);
}

export function runQualityCheck(contentItemId: string): Promise<QualityCheckResponse> {
  return apiRequest<QualityCheckResponse>(`/api/content-studio/items/${contentItemId}/quality-check`, { method: "POST" });
}

export function getQualityCheck(contentItemId: string): Promise<QualityCheckResponse> {
  return apiRequest<QualityCheckResponse>(`/api/content-studio/items/${contentItemId}/quality-check`);
}
