import { getHuggingFaceClient, getHuggingFaceVideoModel } from "../../../config/huggingface";
import { fileStorageService } from "../../storage/fileStorageService";
import { MediaProviderError } from "../errors";
import { VideoGenerationOutcome, VideoGenerationProvider, VideoGenerationRequest } from "./videoProvider.interface";
import { blobToBuffer, mediaAbortSignal, normalizeHuggingFaceError } from "./huggingFaceMedia";

function promptFor(request: VideoGenerationRequest): string {
  const scenes = request.scenes.map((scene) => `Scene ${scene.sceneNumber}: ${scene.visualDescription}. ${scene.animationInstructions ? `Motion and camera: ${scene.animationInstructions}.` : ""}`).join(" ");
  return `Create one coherent short vertical B2B social video. ${scenes} Visual style: ${request.videoStyle}. Brand voice: ${request.brandContext.brandVoice || "professional"}. CTA direction: ${request.cta}. Do not invent claims or text.`;
}

export class HuggingFaceWanVideoProvider implements VideoGenerationProvider {
  readonly name = "huggingface-wan-video-v1";
  readonly isAsync = false;

  async generate(request: VideoGenerationRequest): Promise<VideoGenerationOutcome> {
    try {
      const model = getHuggingFaceVideoModel();
      if (request.aspectRatio !== "9:16" && request.aspectRatio !== "16:9") {
        throw new MediaProviderError("MEDIA_INVALID_REQUEST", "Video aspect ratio must be 9:16 or 16:9.");
      }
      // Wan's current text-to-video provider contract exposes prompt, negative
      // prompt, frames, inference steps, guidance and seed—not arbitrary size,
      // FPS, or duration controls. Verified live against fal.ai's actual
      // endpoint schema (2026-09-15): negative_prompt must be a single
      // string, not an array (fal rejects an array with "Input should be a
      // valid string") - this contradicts @huggingface/tasks' generic
      // TextToVideoParameters.negative_prompt?: string[] type, which reflects
      // the cross-provider spec, not this specific fal.ai endpoint's real
      // behavior; the `as string` cast below is intentional, not an error.
      // num_frames has a hard floor of 81 (fal rejects anything lower with
      // "Input should be greater than or equal to 81") - there is no
      // evidence of an upper cap, so this only enforces the floor.
      const output = await getHuggingFaceClient().textToVideo(
        {
          inputs: promptFor(request),
          model,
          parameters: {
            negative_prompt: "watermark, distorted text, unsupported claims" as unknown as string[],
            num_frames: Math.max(Math.round(request.totalDuration * 16), 81),
            num_inference_steps: 30,
          },
        },
        { retry_on_error: true, signal: mediaAbortSignal() }
      );
      const buffer = await blobToBuffer(output);
      const mimeType = output.type || "video/mp4";
      let stored;
      try { stored = await fileStorageService.storeFile({ buffer, originalFilename: `wan-video-${Date.now()}.mp4`, mimeType, size: buffer.length }); }
      catch { throw new MediaProviderError("MEDIA_STORAGE_FAILED", "Generated video could not be stored."); }
      return { status: "completed", result: { provider: "huggingface", model, providerAssetId: stored.key, url: stored.url ?? stored.key, durationSeconds: request.totalDuration, mimeType, isMock: false } };
    } catch (error) {
      normalizeHuggingFaceError(error);
    }
  }

  async generateVideoFromImage(): Promise<VideoGenerationOutcome> {
    throw new MediaProviderError("MEDIA_CAPABILITY_NOT_SUPPORTED", "Wan-AI/Wan2.1-T2V-1.3B is configured for text-to-video, not image-to-video.");
  }
}
