import { getHuggingFaceClient, getHuggingFaceImageModel } from "../../../config/huggingface";
import { fileStorageService } from "../../storage/fileStorageService";
import { ImageGenerationProvider, ImageGenerationRequest, ImageGenerationResult } from "./imageProvider.interface";
import { blobToBuffer, mediaAbortSignal, normalizeHuggingFaceError } from "./huggingFaceMedia";
import { MediaProviderError } from "../errors";

const DIMENSIONS: Record<string, { width: number; height: number }> = {
  "1:1": { width: 1024, height: 1024 }, "4:5": { width: 1024, height: 1280 }, "9:16": { width: 768, height: 1344 }, "16:9": { width: 1344, height: 768 },
};

function promptFor(request: ImageGenerationRequest): string {
  const brandRules = [request.brandContext.brandVoice, request.brandContext.allowedClaims.length ? `Allowed claims only: ${request.brandContext.allowedClaims.join("; ")}.` : "", request.brandContext.forbiddenClaims.length ? `Never depict or state: ${request.brandContext.forbiddenClaims.join("; ")}.` : ""].filter(Boolean).join(" ");
  return `Professional B2B Instagram creative. Subject: ${request.visualConcept.subject}. ${request.coreMessage}. Style: ${request.visualConcept.style}; mood: ${request.visualConcept.mood}; composition: ${request.visualConcept.composition}; colors: ${request.visualConcept.colorGuidance}. ${request.onScreenText ? `Exact on-screen text: ${request.onScreenText}.` : ""} ${brandRules} No watermark, no invented claims.`;
}

export class HuggingFaceImageProvider implements ImageGenerationProvider {
  readonly name = "huggingface-image-v1";

  async generate(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
    try {
      const model = getHuggingFaceImageModel();
      const dimensions = DIMENSIONS[request.aspectRatio] ?? DIMENSIONS["1:1"];
      const output = await getHuggingFaceClient().textToImage({ inputs: promptFor(request), model, parameters: { width: dimensions.width, height: dimensions.height } }, { outputType: "blob", retry_on_error: true, signal: mediaAbortSignal() });
      const buffer = await blobToBuffer(output);
      const mimeType = output.type || "image/png";
      let stored;
      try { stored = await fileStorageService.storeFile({ buffer, originalFilename: `huggingface-image-${Date.now()}.${mimeType.split("/")[1] || "png"}`, mimeType, size: buffer.length }); }
      catch { throw new MediaProviderError("MEDIA_STORAGE_FAILED", "Generated image could not be stored."); }
      return { provider: "huggingface", model, providerAssetId: stored.key, url: stored.url ?? stored.key, width: dimensions.width, height: dimensions.height, mimeType, isMock: false };
    } catch (error) {
      normalizeHuggingFaceError(error);
    }
  }
}
