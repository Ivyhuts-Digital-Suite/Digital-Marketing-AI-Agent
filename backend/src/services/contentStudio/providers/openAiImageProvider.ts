import OpenAI from "openai";
import { ContentStudioConfigurationError, GenerationProviderError } from "../errors";
import { ImageGenerationProvider, ImageGenerationRequest, ImageGenerationResult } from "./imageProvider.interface";

const DEFAULT_MODEL = "dall-e-3";

type DallE3Size = "1024x1024" | "1792x1024" | "1024x1792";

const ASPECT_RATIO_TO_SIZE: Record<string, DallE3Size> = {
  "1:1": "1024x1024",
  "4:5": "1024x1792",
  "9:16": "1024x1792",
  "16:9": "1792x1024",
};

function getModel(): string {
  const model = process.env.CONTENT_STUDIO_IMAGE_MODEL;
  return model && model.trim().length > 0 ? model.trim() : DEFAULT_MODEL;
}

function sanitizeErrorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  return raw.replace(/sk-[A-Za-z0-9_-]+/g, "[redacted]");
}

function buildPrompt(request: ImageGenerationRequest): string {
  const { visualConcept } = request;
  return [
    `Instagram ${request.subtype.replace(/_/g, " ")} graphic.`,
    `Subject: ${visualConcept.subject}.`,
    `Style: ${visualConcept.style}. Mood: ${visualConcept.mood}. Composition: ${visualConcept.composition}.`,
    visualConcept.visualElements.length > 0 ? `Include: ${visualConcept.visualElements.join(", ")}.` : null,
    visualConcept.colorGuidance ? `Color palette: ${visualConcept.colorGuidance}.` : null,
    visualConcept.typographyGuidance ? `Typography feel: ${visualConcept.typographyGuidance}.` : null,
    request.onScreenText ? `On-screen text to depict clearly: "${request.onScreenText}".` : null,
    "Professional B2B marketing creative, no watermarks, no placeholder text other than the on-screen text specified.",
  ]
    .filter((line): line is string => Boolean(line))
    .join(" ");
}

/**
 * Real image generation, backed by OpenAI's Images API (DALL-E 3).
 *
 * OpenAI is no longer the backend's intelligence/reasoning provider - that
 * role belongs to Gemini (see src/services/ai/**). This provider is purely
 * a media generator: it turns an already-decided visual concept into an
 * image file and has no say in what content should be created. It has its
 * own OPENAI_API_KEY requirement, independent of Gemini - Company/Content
 * Intelligence and Creative Brief generation work with only
 * GEMINI_API_KEY configured; OPENAI_API_KEY is only needed if this
 * provider is enabled (see below) or for embeddings (src/services/embedding).
 *
 * Not registered as the default provider (see imageProviderFactory.ts) -
 * every call here costs real money and takes real latency, so it only
 * activates when CONTENT_STUDIO_IMAGE_PROVIDER=openai is set explicitly.
 */
export class OpenAiImageProvider implements ImageGenerationProvider {
  readonly name = "openai-dalle3";

  private getClient(): OpenAI {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey.trim().length === 0) {
      throw new ContentStudioConfigurationError("OPENAI_API_KEY is not set in the environment");
    }
    return new OpenAI({ apiKey });
  }

  async generate(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
    const client = this.getClient();
    const model = getModel();
    const size = ASPECT_RATIO_TO_SIZE[request.aspectRatio] ?? "1024x1024";
    const prompt = buildPrompt(request);

    let response;
    try {
      response = await client.images.generate({
        model,
        prompt,
        size,
        n: 1,
        response_format: "b64_json",
      });
    } catch (error) {
      throw new GenerationProviderError(this.name, sanitizeErrorMessage(error));
    }

    const image = response.data?.[0];
    if (!image?.b64_json) {
      throw new GenerationProviderError(this.name, "the provider returned no image data");
    }

    return {
      provider: this.name,
      model,
      url: `data:image/png;base64,${image.b64_json}`,
      mimeType: "image/png",
      isMock: false,
      raw: { model, size, revisedPrompt: image.revised_prompt },
    };
  }
}
