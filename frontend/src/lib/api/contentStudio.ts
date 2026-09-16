import { apiRequest } from "./client";
import {
  ContentStudioRequest,
  CreateCreativeBriefResponse,
  GenerateGraphicResponse,
  GenerateVideoResponse,
  GetContentAssetsResponse,
  GetCreativeBriefResponse,
  GetGenerationJobResponse,
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
