import { ApiError } from "@google/genai";
import { getGeminiClient } from "../../../config/gemini";
import { fileStorageService } from "../../storage/fileStorageService";
import { ContentStudioConfigurationError, GenerationProviderError } from "../errors";
import { ImageGenerationProvider, ImageGenerationRequest, ImageGenerationResult } from "./imageProvider.interface";

/**
 * Real image generation, backed by Gemini's native multimodal image output
 * (the "Nano Banana" family) via generateContent - NOT the separate Imagen
 * `generateImages` endpoint. This was a real, verified finding: this
 * project's API key has zero free-tier quota for `client.models.generateImages`
 * (the Imagen models don't even appear in `client.models.list()` for this
 * key), while image-capable Gemini models (gemini-3.1-flash-image, etc.) DO
 * appear there with `generateContent` as a supported action - so image
 * generation must go through the same generateContent surface as text,
 * requesting `responseModalities: ["image"]`, and reading the result out of
 * an `inlineData` part rather than a `GeneratedImage[]` array.
 *
 * IMPORTANT (verified live, 2026-09-13): generateContent calls to
 * gemini-3.1-flash-image on this API key currently fail with HTTP 429
 * "RESOURCE_EXHAUSTED ... limit: 0" for the free tier - Gemini image models
 * are not available on the free tier at all, regardless of retrying. This
 * provider is real, correct code against the documented API - it simply
 * requires a billing-enabled Google AI Studio / Cloud project to actually
 * produce images. See GeminiImageConfigurationError below.
 */

const DEFAULT_MODEL = "gemini-3.1-flash-image";

/** Only "1:1", "2:3", "3:2", "3:4", "4:3", "9:16", "16:9", "21:9" are supported by Gemini's ImageConfig.aspectRatio - our brief aspect ratios don't map 1:1, so the nearest supported ratio is used (documented per-mapping below, not silently substituted). */
const ASPECT_RATIO_MAP: Record<string, string> = {
  "1:1": "1:1",
  "4:5": "3:4", // nearest supported portrait ratio; Gemini does not offer 4:5
  "9:16": "9:16",
  "16:9": "16:9",
};

function resolveModel(): string {
  const model = process.env.GEMINI_IMAGE_MODEL || process.env.CONTENT_STUDIO_IMAGE_MODEL;
  return model && model.trim().length > 0 ? model.trim() : DEFAULT_MODEL;
}

function sanitizeErrorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  return raw.replace(/AIza[A-Za-z0-9_-]+/g, "[redacted]");
}

/** True for the specific "free tier has zero quota for this model" failure mode found during implementation - distinct from a transient rate limit, since retrying will never succeed without enabling billing. */
function isFreeTierZeroQuota(message: string): boolean {
  return /RESOURCE_EXHAUSTED/i.test(message) && /free_tier/i.test(message) && /limit["']?:\s*0\b/i.test(message);
}

function buildPrompt(request: ImageGenerationRequest): string {
  const { visualConcept, infographic } = request;

  if (infographic) {
    return [
      `Instagram ${request.subtype.replace(/_/g, " ")} - a structured INFOGRAPHIC, not a generic photo/illustration.`,
      `Title (render prominently at the top): "${infographic.title}".`,
      infographic.keyStatistics.length > 0
        ? `Key statistics to depict as bold callout numbers: ${infographic.keyStatistics.join(", ")}.`
        : null,
      infographic.keyPoints.length > 0
        ? `Key points, each paired with a simple icon, arranged in a clear visual hierarchy: ${infographic.keyPoints.join(" | ")}.`
        : null,
      infographic.iconHints.length > 0 ? `Icon/illustration style guidance: ${infographic.iconHints.join(", ")}.` : null,
      `CTA at the bottom: "${infographic.cta}".`,
      `Style: ${visualConcept.style}. Mood: ${visualConcept.mood}. Color palette: ${visualConcept.colorGuidance}.`,
      `Typography: ${visualConcept.typographyGuidance}.`,
      "Layout must read top-to-bottom as: title, then stats/points with icons, then CTA. Professional B2B infographic, no watermarks.",
    ]
      .filter((line): line is string => Boolean(line))
      .join(" ");
  }

  return [
    `Instagram ${request.subtype.replace(/_/g, " ")} graphic.`,
    `Subject: ${visualConcept.subject}.`,
    `Style: ${visualConcept.style}. Mood: ${visualConcept.mood}. Composition: ${visualConcept.composition}.`,
    visualConcept.visualElements.length > 0 ? `Include: ${visualConcept.visualElements.join(", ")}.` : null,
    visualConcept.colorGuidance ? `Color palette: ${visualConcept.colorGuidance}.` : null,
    visualConcept.typographyGuidance ? `Typography feel: ${visualConcept.typographyGuidance}.` : null,
    request.onScreenText ? `Render this exact on-screen text clearly and legibly: "${request.onScreenText}".` : null,
    "Professional B2B marketing creative, no watermarks, no placeholder text other than the on-screen text specified.",
  ]
    .filter((line): line is string => Boolean(line))
    .join(" ");
}

export class GeminiImageProvider implements ImageGenerationProvider {
  readonly name = "gemini-image-v1";

  async generate(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
    const model = resolveModel();
    const prompt = buildPrompt(request);
    const aspectRatio = ASPECT_RATIO_MAP[request.aspectRatio] ?? "1:1";

    let response;
    try {
      const client = getGeminiClient();
      response = await client.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseModalities: ["image"],
          imageConfig: { aspectRatio },
        },
      });
    } catch (error) {
      const message = sanitizeErrorMessage(error);
      if (error instanceof ApiError && isFreeTierZeroQuota(message)) {
        throw new ContentStudioConfigurationError(
          `Gemini image generation ("${model}") requires a billing-enabled Google AI Studio/Cloud project - ` +
            `the current GEMINI_API_KEY is on the free tier, which has zero quota for image-generation models. ` +
            `Enable billing at https://aistudio.google.com/ or set CONTENT_STUDIO_IMAGE_PROVIDER=mock/openai.`
        );
      }
      if (error instanceof Error && error.message.includes("GEMINI_API_KEY")) {
        throw new ContentStudioConfigurationError(error.message);
      }
      throw new GenerationProviderError(this.name, message);
    }

    const parts = response.candidates?.[0]?.content?.parts ?? [];
    const imagePart = parts.find((part) => Boolean(part.inlineData?.data));

    if (!imagePart?.inlineData?.data) {
      const textPart = parts.find((part) => part.text);
      throw new GenerationProviderError(
        this.name,
        textPart?.text
          ? `Gemini did not return image data - it responded with text instead: "${textPart.text.slice(0, 200)}"`
          : "Gemini returned no image data"
      );
    }

    const buffer = Buffer.from(imagePart.inlineData.data, "base64");
    const mimeType = imagePart.inlineData.mimeType || "image/png";
    const extension = mimeType.split("/")[1] || "png";

    const stored = await fileStorageService.storeFile({
      buffer,
      originalFilename: `${request.subtype}-${Date.now()}.${extension}`,
      mimeType,
      size: buffer.length,
    });

    return {
      provider: this.name,
      model,
      providerAssetId: stored.key,
      url: stored.url ?? stored.key,
      mimeType,
      isMock: false,
      raw: { model, aspectRatioRequested: request.aspectRatio, aspectRatioUsed: aspectRatio, usage: response.usageMetadata },
    };
  }
}
