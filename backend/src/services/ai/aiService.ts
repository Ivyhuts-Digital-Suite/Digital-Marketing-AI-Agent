import { GeminiProvider } from "./geminiProvider";
import { LLMProvider } from "./llmProvider.types";

/**
 * The single accessor point every domain module (companyIntelligence,
 * contentIntelligence, contentStudio) imports for LLM intelligence.
 * Currently backed by Gemini - swapping or adding a provider later means
 * changing only this file, never the business services that use it.
 */
export const aiService: LLMProvider = new GeminiProvider();
