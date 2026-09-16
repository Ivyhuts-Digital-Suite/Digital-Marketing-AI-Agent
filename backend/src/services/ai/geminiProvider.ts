import { ApiError, GenerateContentResponseUsageMetadata } from "@google/genai";
import { z, ZodType } from "zod";
import { GeminiConfigurationError, getGeminiClient, resolveGeminiModel } from "../../config/gemini";
import { LLMProviderError } from "./llmErrors";
import { LLMProvider, LLMRequestOptions, LLMStructuredResult, LLMTextResult, LLMUsage } from "./llmProvider.types";

/** Generous enough for the structured JSON this backend extracts (company intelligence, content briefs, creative direction) without needing streaming. */
const DEFAULT_MAX_TOKENS = 4096;
const DEFAULT_TEMPERATURE = 0.4;
const MAX_GEMINI_ATTEMPTS = 3;
const RETRY_DELAYS_MS = [2_000, 5_000, 10_000] as const;

function extractUsage(usage: GenerateContentResponseUsageMetadata | undefined): LLMUsage {
  if (!usage) return {};
  return {
    inputTokens: usage.promptTokenCount,
    outputTokens: usage.candidatesTokenCount,
    totalTokens: usage.totalTokenCount,
  };
}

/** Strips anything that looks like an API key before an error can surface it. */
function sanitize(message: string): string {
  return message.replace(/AIza[A-Za-z0-9_-]+/g, "[redacted]");
}

/** Exported for deterministic tests; only rate limits and temporary 503s retry. */
export function isTransientGeminiError(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 429 || error.status === 503);
}

function retryDelayMs(attempt: number): number {
  const configured = process.env.GEMINI_RETRY_DELAYS_MS?.split(",").map((value) => Number(value.trim())).filter((value) => Number.isFinite(value) && value >= 0);
  return configured?.[attempt - 1] ?? RETRY_DELAYS_MS[attempt - 1] ?? RETRY_DELAYS_MS[RETRY_DELAYS_MS.length - 1];
}

async function withGeminiRetry<T>(model: string, request: () => Promise<T>): Promise<T> {
  for (let attempt = 1; attempt <= MAX_GEMINI_ATTEMPTS; attempt++) {
    try {
      return await request();
    } catch (error) {
      if (!isTransientGeminiError(error) || attempt === MAX_GEMINI_ATTEMPTS) throw error;
      const delay = retryDelayMs(attempt);
      // Deliberately log only safe operational metadata—never prompts, schema,
      // response data, headers, or credentials.
      console.warn(`Gemini request retry scheduled: attempt ${attempt + 1}/${MAX_GEMINI_ATTEMPTS}, status ${(error as ApiError).status}, model ${model}, delayMs ${delay}`);
      await new Promise<void>((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error("Unreachable Gemini retry state");
}

/** Maps every failure mode (missing config, SDK errors, anything else) onto the provider-independent taxonomy - never exposes raw SDK internals, headers, or stack traces. */
function normalizeError(error: unknown): LLMProviderError {
  if (error instanceof LLMProviderError) {
    return error;
  }
  if (error instanceof GeminiConfigurationError) {
    return new LLMProviderError("configuration", error.message);
  }
  if (error instanceof ApiError) {
    const status = error.status;
    if (status === 401 || status === 403) {
      return new LLMProviderError("authentication", "Gemini API authentication failed");
    }
    if (status === 429) {
      return new LLMProviderError("rate_limit", "Gemini API rate limit exceeded");
    }
    if (status >= 500) {
      return new LLMProviderError("network", "Gemini API is currently unavailable");
    }
    return new LLMProviderError("unknown", sanitize(error.message));
  }
  if (error instanceof z.ZodError) {
    return new LLMProviderError("invalid_response", "Gemini's response did not match the expected structure");
  }
  const message = error instanceof Error ? error.message : String(error);
  if (/timeout/i.test(message)) {
    return new LLMProviderError("timeout", "Gemini API request timed out");
  }
  if (/fetch failed|ECONNREFUSED|ENOTFOUND|network/i.test(message)) {
    return new LLMProviderError("network", "Could not reach the Gemini API");
  }
  return new LLMProviderError("unknown", sanitize(message));
}

/** The one and only LLMProvider implementation today, backed by the official Google Gen AI SDK. */
export class GeminiProvider implements LLMProvider {
  async generateText(options: LLMRequestOptions): Promise<LLMTextResult> {
    try {
      const client = getGeminiClient();
      const model = resolveGeminiModel(options.model);

      const response = await withGeminiRetry(model, () => client.models.generateContent({
        model,
        contents: options.prompt,
        config: {
          systemInstruction: options.system,
          temperature: options.temperature ?? DEFAULT_TEMPERATURE,
          maxOutputTokens: options.maxTokens ?? DEFAULT_MAX_TOKENS,
        },
      }));

      const text = response.text;
      if (!text || text.trim().length === 0) {
        throw new LLMProviderError("invalid_response", "Gemini returned an empty response");
      }

      return { text, model: response.modelVersion ?? model, usage: extractUsage(response.usageMetadata) };
    } catch (error) {
      throw normalizeError(error);
    }
  }

  async generateStructured<T>(options: LLMRequestOptions & { schema: ZodType<T> }): Promise<LLMStructuredResult<T>> {
    try {
      const client = getGeminiClient();
      const model = resolveGeminiModel(options.model);
      const jsonSchema = z.toJSONSchema(options.schema);

      const response = await withGeminiRetry(model, () => client.models.generateContent({
        model,
        contents: options.prompt,
        config: {
          systemInstruction: options.system,
          temperature: options.temperature ?? DEFAULT_TEMPERATURE,
          maxOutputTokens: options.maxTokens ?? DEFAULT_MAX_TOKENS,
          responseMimeType: "application/json",
          responseSchema: jsonSchema,
        },
      }));

      const text = response.text;
      if (!text || text.trim().length === 0) {
        throw new LLMProviderError("invalid_response", "Gemini returned an empty response");
      }

      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(text);
      } catch {
        throw new LLMProviderError("invalid_response", "Gemini's response was not valid JSON");
      }

      // Validated against `schema` here (not left to the caller) so the
      // LLMProvider contract holds regardless of which provider is behind
      // it - domain services still run their own validation afterward too.
      const data = options.schema.parse(parsedJson);

      return { data, model: response.modelVersion ?? model, usage: extractUsage(response.usageMetadata) };
    } catch (error) {
      throw normalizeError(error);
    }
  }
}
