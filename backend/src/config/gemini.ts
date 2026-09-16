import { GoogleGenAI } from "@google/genai";

/**
 * Gemini is the backend's single intelligence/reasoning provider (company
 * intelligence, content intelligence, creative brief generation). Media
 * generation (images/video) is a completely separate concern handled by
 * src/services/contentStudio/providers/** - Gemini never generates media
 * files itself.
 *
 * Model note: "gemini-2.5-flash" (the model shown in Google's own quickstart
 * docs at the time this was written) returns 404 "no longer available to
 * new users" against a freshly-issued API key, with the API itself pointing
 * to "gemini-3.6-flash" as the replacement - verified directly against the
 * live Gemini API, not assumed from documentation. See resolveGeminiModel.
 */

const DEFAULT_MODEL = "gemini-3.6-flash";

export class GeminiConfigurationError extends Error {
  constructor(reason: string) {
    super(`Gemini is not configured correctly: ${reason}`);
    this.name = "GeminiConfigurationError";
  }
}

let client: GoogleGenAI | null = null;

/**
 * Lazily creates and reuses a single GoogleGenAI client for the whole
 * process - never instantiate `new GoogleGenAI()` anywhere else. Throws
 * only when actually called, never at import time, so the app boots fine
 * without GEMINI_API_KEY and only fails once AI generation is actually
 * requested.
 */
export function getGeminiClient(): GoogleGenAI {
  if (client) {
    return client;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim().length === 0) {
    throw new GeminiConfigurationError("GEMINI_API_KEY is not set in the environment");
  }

  client = new GoogleGenAI({ apiKey });
  return client;
}

/**
 * Resolves which Gemini model a call should use: an explicit per-call/
 * per-service override, else the shared GEMINI_MODEL env var, else a
 * current, real Gemini model id. This is the ONLY place a default model id
 * is hardcoded - business services request capabilities and pass along
 * their own optional override; they never hardcode a model id themselves.
 */
export function resolveGeminiModel(override?: string): string {
  if (override && override.trim().length > 0) {
    return override.trim();
  }

  const configured = process.env.GEMINI_MODEL;
  return configured && configured.trim().length > 0 ? configured.trim() : DEFAULT_MODEL;
}
