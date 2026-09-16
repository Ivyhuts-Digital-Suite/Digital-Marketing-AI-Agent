import { ImageGenerationProvider } from "./imageProvider.interface";
import { MockImageProvider } from "./mockImageProvider";
import { OpenAiImageProvider } from "./openAiImageProvider";
import { ContentStudioConfigurationError } from "../errors";
import { HuggingFaceImageProvider } from "./huggingFaceImageProvider";

/**
 * Gemini is the production/demo default whenever its backend-only key is
 * configured. Mock remains available only when explicitly selected for tests;
 * there is deliberately no silent mock fallback for a missing media setup.
 */
export function getImageProvider(): ImageGenerationProvider {
  const configured = (process.env.MEDIA_IMAGE_PROVIDER || (process.env.HUGGINGFACE_API_KEY ? "huggingface" : "")).trim().toLowerCase();

  switch (configured) {
    case "huggingface":
      return new HuggingFaceImageProvider();
    case "mock":
      return new MockImageProvider();
    default:
      throw new ContentStudioConfigurationError("Hugging Face media generation is not configured. Add HUGGINGFACE_API_KEY to enable real image/video generation.");
  }
}
