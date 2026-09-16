import { InferenceClient } from "@huggingface/inference";

export class HuggingFaceConfigurationError extends Error {
  constructor(reason: string) {
    super(`Hugging Face media generation is not configured: ${reason}`);
    this.name = "HuggingFaceConfigurationError";
  }
}

let client: InferenceClient | null = null;

/** Lazily initialized so unrelated backend routes work without media credentials. */
export function getHuggingFaceClient(): InferenceClient {
  if (client) return client;
  const apiKey = process.env.HUGGINGFACE_API_KEY?.trim();
  if (!apiKey) throw new HuggingFaceConfigurationError("HUGGINGFACE_API_KEY is not set");
  client = new InferenceClient(apiKey);
  return client;
}

export function getHuggingFaceImageModel(): string {
  const model = process.env.HUGGINGFACE_IMAGE_MODEL?.trim();
  if (!model) {
    throw new HuggingFaceConfigurationError("HUGGINGFACE_IMAGE_MODEL is not set; choose an image-capable Hugging Face model");
  }
  return model;
}

/**
 * Default verified live, 2026-09-15: Wan-AI/Wan2.1-T2V-1.3B's fal.ai routing
 * currently returns HTTP 404 "Path /v2.1/1.3b/text-to-video not found" from
 * fal's own queue API (a stale mapping on fal's side, not something fixable
 * from this codebase) even though Hugging Face's public partner mapping
 * still lists it as "live". Wan-AI/Wan2.1-T2V-14B uses a flatter fal.ai
 * route ("fal-ai/wan-t2v") and was confirmed end-to-end: submitted a real
 * job, polled to completion, and downloaded a genuine video/mp4 (~2.6MB for
 * an ~18s clip, ~2 minutes wall time).
 */
export function getHuggingFaceVideoModel(): string {
  return process.env.HUGGINGFACE_VIDEO_MODEL?.trim() || "Wan-AI/Wan2.1-T2V-14B";
}
