import { ZodType } from "zod";

/**
 * Provider-agnostic LLM abstraction. Business services (companyIntelligence,
 * contentIntelligence, contentStudio) depend only on this interface, never
 * on the Google Gen AI SDK directly - see geminiProvider.ts for the one
 * implementation and aiService.ts for the shared accessor every domain
 * module imports.
 */

export interface LLMUsage {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
}

export interface LLMRequestOptions {
  /** System instructions - grounding rules, output constraints, persona. */
  system: string;
  /** The user-turn content - already-built context + task instructions. */
  prompt: string;
  /** Per-call/per-service model override. Omit to use the centrally configured default (see config/gemini.ts). */
  model?: string;
  temperature?: number;
  /** Defaults to a size appropriate for structured JSON extraction if omitted. */
  maxTokens?: number;
}

export interface LLMTextResult {
  text: string;
  model: string;
  usage: LLMUsage;
}

export interface LLMStructuredResult<T> {
  data: T;
  model: string;
  usage: LLMUsage;
}

export interface LLMProvider {
  /** Free-form text generation. */
  generateText(options: LLMRequestOptions): Promise<LLMTextResult>;

  /**
   * Structured JSON generation, validated against `schema` by the provider
   * itself before this ever returns - callers still route `data` through
   * their own domain-specific validation afterward (never trust LLM output
   * from a single layer alone).
   */
  generateStructured<T>(options: LLMRequestOptions & { schema: ZodType<T> }): Promise<LLMStructuredResult<T>>;
}
