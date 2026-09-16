import { ApiError, GenerateVideosOperation } from "@google/genai";
import fs from "fs";
import os from "os";
import path from "path";
import { getGeminiClient } from "../../../config/gemini";
import { fileStorageService } from "../../storage/fileStorageService";
import { ContentStudioConfigurationError, GenerationProviderError, MediaProviderError } from "../errors";
import { VideoGenerationOutcome, VideoGenerationProvider, VideoGenerationRequest } from "./videoProvider.interface";

/**
 * Real video generation, backed by Veo via the SDK's generateVideos/
 * operations.getVideosOperation long-running-operation pattern (confirmed
 * from node_modules/@google/genai/dist/node/node.d.ts - not guessed). Veo
 * models (veo-3.1-generate-preview, veo-3.1-fast-generate-preview,
 * veo-3.1-lite-generate-preview) ARE listed as available to this project's
 * API key (action: "predictLongRunning" in client.models.list()) - this is
 * a genuinely real, documented capability, distinct from the Imagen
 * situation on the image side.
 *
 * IMPORTANT (verified live, 2026-09-13): submitting a generateVideos
 * request on this API key currently fails with HTTP 429
 * "RESOURCE_EXHAUSTED" for the free tier - like image generation, Veo is
 * not available on the free tier at all. This provider is real, correct
 * code against the documented API; it requires a billing-enabled Google AI
 * Studio/Cloud project to actually submit and complete a video job. See
 * GeminiVideoConfigurationError below.
 *
 * Video generation is a genuinely asynchronous long-running operation
 * (unlike text/image generation) - generate() only SUBMITS the job and
 * returns {status: "processing"}; checkStatus() is what advances/finalizes
 * it, called by videoGenerationService.ts each time GET /jobs/:jobId polls.
 */

const DEFAULT_MODEL = "veo-3.1-generate-preview";
const MIN_DURATION_SECONDS = 4;
const MAX_DURATION_SECONDS = 8;

/** Veo's GenerateVideosConfig.aspectRatio only documents "16:9" and "9:16" - unlike the image side there is no close-enough fallback to substitute for other ratios. */
const SUPPORTED_ASPECT_RATIOS = new Set(["16:9", "9:16"]);

function resolveModel(): string {
  const model = process.env.GEMINI_VIDEO_MODEL || process.env.CONTENT_STUDIO_VIDEO_MODEL;
  return model && model.trim().length > 0 ? model.trim() : DEFAULT_MODEL;
}

function sanitizeErrorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  return raw.replace(/AIza[A-Za-z0-9_-]+/g, "[redacted]");
}

function isFreeTierZeroQuota(message: string): boolean {
  return /RESOURCE_EXHAUSTED/i.test(message) && (/free_tier/i.test(message) || /quota/i.test(message));
}

function normalizeGeminiError(error: unknown, phase: "generation" | "download"): Error {
  const message = sanitizeErrorMessage(error);
  if (error instanceof MediaProviderError || error instanceof ContentStudioConfigurationError) return error;
  if (error instanceof ApiError && /401|403|UNAUTHENTICATED|PERMISSION_DENIED/i.test(message)) {
    return new MediaProviderError("MEDIA_PROVIDER_AUTH_FAILED", "Gemini Veo authentication was rejected. Check the server-side Gemini configuration.");
  }
  if (error instanceof ApiError && /429|RESOURCE_EXHAUSTED|rate.?limit|quota/i.test(message)) {
    return new MediaProviderError("MEDIA_PROVIDER_RATE_LIMITED", "Gemini Veo is temporarily unavailable due to quota or rate limits. Please generate again later.");
  }
  return new MediaProviderError(phase === "download" ? "MEDIA_STORAGE_FAILED" : "MEDIA_GENERATION_FAILED", phase === "download" ? "VIDEO_DOWNLOAD_FAILED: Gemini returned a video that could not be downloaded or stored." : "VIDEO_GENERATION_FAILED: Gemini Veo could not generate this video.");
}

function buildPrompt(request: VideoGenerationRequest): string {
  const styleNote =
    request.videoStyle === "cinematic"
      ? "Cinematic, live-action style footage with natural camera movement."
      : "Clean, modern motion-graphic / animated explainer style.";

  const sceneLines = request.scenes
    .map((scene) => {
      const parts = [`Scene ${scene.sceneNumber} (${scene.duration}s): ${scene.visualDescription}`];
      if (scene.onScreenText) parts.push(`On-screen text: "${scene.onScreenText}".`);
      if (scene.animationInstructions) parts.push(`Motion: ${scene.animationInstructions}.`);
      return parts.join(" ");
    })
    .join(" ");

  return `${styleNote} Create a fresh visual interpretation while preserving the approved marketing message, brand direction, and CTA. Brand voice: ${request.brandContext.brandVoice || "professional"}. ${sceneLines} Close on the call to action: "${request.cta}". Do not add claims, logos, watermarks, or unsupported on-screen copy.`;
}

function isMp4(buffer: Buffer): boolean {
  // ISO BMFF MP4 files contain the ftyp box at byte offset four. This rejects
  // JSON/SVG/text responses even when an upstream MIME type is wrong.
  return buffer.length > 12 && buffer.subarray(4, 8).toString("ascii") === "ftyp";
}

interface StoredOperationState extends Record<string, unknown> {
  __meta: { model: string; totalDuration: number };
}

export class GeminiVideoProvider implements VideoGenerationProvider {
  readonly name = "gemini-video-v1";
  readonly isAsync = true;

  async generate(request: VideoGenerationRequest): Promise<VideoGenerationOutcome> {
    const requestedAspectRatio = request.aspectRatio || process.env.GEMINI_VIDEO_ASPECT_RATIO || "9:16";
    const aspectRatio = SUPPORTED_ASPECT_RATIOS.has(requestedAspectRatio) ? requestedAspectRatio : undefined;
    if (!aspectRatio) {
      throw new GenerationProviderError(
        this.name,
        `Gemini video generation only supports 16:9 or 9:16 aspect ratios; "${requestedAspectRatio}" is not supported.`
      );
    }

    const model = resolveModel();
    const prompt = buildPrompt(request);
    const durationSeconds = Math.min(Math.max(Math.round(request.totalDuration), MIN_DURATION_SECONDS), MAX_DURATION_SECONDS);
    const resolution = process.env.GEMINI_VIDEO_RESOLUTION || "720p";

    let operation: GenerateVideosOperation;
    try {
      const client = getGeminiClient();
      operation = await client.models.generateVideos({
        model,
        source: { prompt },
        config: { numberOfVideos: 1, aspectRatio, durationSeconds, resolution },
      });
    } catch (error) {
      const message = sanitizeErrorMessage(error);
      if (error instanceof ApiError && isFreeTierZeroQuota(message)) throw normalizeGeminiError(error, "generation");
      if (error instanceof Error && error.message.includes("GEMINI_API_KEY")) {
        throw new ContentStudioConfigurationError(error.message);
      }
      throw normalizeGeminiError(error, "generation");
    }

    if (!operation.name) {
      throw new GenerationProviderError(this.name, "Gemini did not return an operation id for this video generation request.");
    }

    const state: StoredOperationState = {
      ...JSON.parse(JSON.stringify(operation)),
      __meta: { model, totalDuration: request.totalDuration },
    };

    return {
      status: "processing",
      provider: this.name,
      model,
      providerJobId: operation.name,
      providerOperationState: state,
    };
  }

  async checkStatus(providerOperationState: Record<string, unknown>): Promise<VideoGenerationOutcome> {
    const state = providerOperationState as StoredOperationState;
    const meta = state.__meta;

    let operation: GenerateVideosOperation;
    try {
      const client = getGeminiClient();
      operation = await client.operations.getVideosOperation({
        operation: state as unknown as GenerateVideosOperation,
      });
    } catch (error) {
      throw normalizeGeminiError(error, "generation");
    }

    if (!operation.done) {
      return {
        status: "processing",
        provider: this.name,
        model: meta?.model,
        providerJobId: operation.name ?? (state.name as string),
        providerOperationState: { ...JSON.parse(JSON.stringify(operation)), __meta: meta },
      };
    }

    if (operation.error) {
      throw new GenerationProviderError(this.name, `Gemini video generation failed: ${JSON.stringify(operation.error)}`);
    }

    const generated = operation.response?.generatedVideos?.[0];
    const video = generated?.video;
    if (!video) {
      throw new GenerationProviderError(this.name, "Gemini reported the video operation as done but returned no video.");
    }

    const tempDirectory = await fs.promises.mkdtemp(path.join(os.tmpdir(), "content-studio-veo-"));
    const tempPath = path.join(tempDirectory, "video.mp4");
    try {
      const client = getGeminiClient();
      await client.files.download({ file: video, downloadPath: tempPath });
      const buffer = await fs.promises.readFile(tempPath);
      const mimeType = video.mimeType || "video/mp4";
      if (mimeType.toLowerCase() !== "video/mp4" || !isMp4(buffer)) {
        throw new GenerationProviderError(this.name, "VIDEO_ASSET_INVALID: Gemini output was not an MP4 file.");
      }
      const stored = await fileStorageService.storeFile({
        buffer,
        originalFilename: `veo-${Date.now()}.mp4`,
        mimeType,
        size: buffer.length,
      });
      return {
        status: "completed",
        result: {
          provider: this.name,
          model: meta?.model,
          providerAssetId: stored.key,
          url: stored.url ?? stored.key,
          durationSeconds: meta?.totalDuration ?? MAX_DURATION_SECONDS,
          mimeType,
          isMock: false,
          raw: { operationName: operation.name },
        },
      };
    } catch (error) {
      throw normalizeGeminiError(error, "download");
    } finally {
      await fs.promises.rm(tempDirectory, { recursive: true, force: true }).catch(() => undefined);
    }
  }
}
