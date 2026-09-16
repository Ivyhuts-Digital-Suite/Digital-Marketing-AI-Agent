import { VideoGenerationProvider } from "./videoProvider.interface";
import { MockVideoProvider } from "./mockVideoProvider";
import { ContentStudioConfigurationError } from "../errors";
import { HuggingFaceWanVideoProvider } from "./huggingFaceWanVideoProvider";
import { GeminiVideoProvider } from "./geminiVideoProvider";

/**
 * Gemini Veo is the production/demo default whenever GEMINI_API_KEY is set.
 * Mock is an explicit test-only choice and is never selected as a fallback.
 */
export function getVideoProvider(): VideoGenerationProvider {
  const configured = (process.env.MEDIA_VIDEO_PROVIDER || (process.env.GEMINI_API_KEY ? "gemini" : process.env.HUGGINGFACE_API_KEY ? "huggingface" : "")).trim().toLowerCase();

  switch (configured) {
    case "gemini":
    case "veo":
      return new GeminiVideoProvider();
    case "huggingface":
      return new HuggingFaceWanVideoProvider();
    case "mock":
      // A scene manifest is useful in tests, but it is never a video. Keep
      // this explicit test adapter from accidentally becoming production's
      // successful video path.
      return new MockVideoProvider();
    default:
      throw new ContentStudioConfigurationError("Video generation is not configured. Set MEDIA_VIDEO_PROVIDER=gemini and GEMINI_API_KEY to generate Veo videos.");
  }
}
