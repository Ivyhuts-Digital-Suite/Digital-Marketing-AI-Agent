import { z } from "zod";
import { aiService } from "../ai/aiService";
import { LLMProviderError } from "../ai/llmErrors";
import { CompanyIntelligenceConfigurationError, LlmRequestError } from "./errors";
import { CompanyIntelligenceContext, CompanyIntelligenceLlmResult } from "./types";
import { parseAndValidateLlmResponse } from "./companyIntelligenceValidation";

const productOrServiceSchema = z.object({
  name: z.string(),
  description: z.string(),
  targetAudience: z.string(),
  problemsSolved: z.array(z.string()),
  benefits: z.array(z.string()),
  differentiators: z.array(z.string()),
});

const COMPANY_INTELLIGENCE_SCHEMA = z.object({
  companyOverview: z.string(),
  industry: z.string(),
  targetCustomers: z.array(z.string()),
  customerProblems: z.array(z.string()),
  products: z.array(productOrServiceSchema),
  services: z.array(productOrServiceSchema),
  differentiators: z.array(z.string()),
  competitors: z.array(z.string()),
  valuePropositions: z.array(z.string()),
  brandVoice: z.string(),
  marketingMessaging: z.array(z.string()),
  allowedClaims: z.array(z.string()),
  forbiddenClaims: z.array(z.string()),
  importantFacts: z.array(z.string()),
});

const SYSTEM_PROMPT = `You are a precise company-intelligence extraction engine for a marketing platform.

You ONLY use information explicitly present in the "COMPANY CONTEXT" the user provides. You never use outside/general knowledge about any company, even if the name looks familiar.

Rules:
- If a fact is not present in the context, represent it as an empty string, empty array, or "unknown" - never invent, guess, or assume it.
- Do not copy marketing fluff verbatim if it is not a factual claim; keep the extracted content grounded in what the context actually says.
- "allowedClaims" are things the context supports the company saying about itself. "forbiddenClaims" are claims the context explicitly rules out, warns against, or contradicts - leave it empty if nothing like that is present.
- Every field in the response schema is required - use an empty string or empty array when the context has nothing to offer for that field. Never omit a field.`;

function getModelOverride(): string | undefined {
  const model = process.env.COMPANY_INTELLIGENCE_MODEL;
  return model && model.trim().length > 0 ? model.trim() : undefined;
}

/** Turns the gathered context into the user-message text sent to the LLM. Pure/testable - no network call. */
export function buildUserPrompt(context: CompanyIntelligenceContext): string {
  const parts: string[] = [];

  if (context.onboarding) {
    parts.push(`[ONBOARDING DATA]\n${JSON.stringify(context.onboarding)}`);
  }

  context.excerpts.forEach((excerpt, index) => {
    const tag =
      excerpt.sourceType === "url"
        ? `type=website${excerpt.pageType ? `, pageType=${excerpt.pageType}` : ""}${excerpt.url ? `, url=${excerpt.url}` : ""}`
        : `type=document, filename=${excerpt.label}`;
    parts.push(`[SOURCE ${index + 1}: ${tag}]\n${excerpt.text}`);
  });

  const contextBlock = parts.length > 0 ? parts.join("\n\n") : "(no company context is available)";

  return `COMPANY CONTEXT:\n\n${contextBlock}\n\nExtract the structured company intelligence described in the system instructions from the COMPANY CONTEXT above.`;
}

/**
 * Calls Gemini and returns its validated, structured response. Exported
 * separately from the orchestrating service so it can be exercised
 * directly in tests without needing a database. Never fabricates a
 * result: if GEMINI_API_KEY is missing, this throws before making any
 * network call.
 */
export async function requestCompanyIntelligenceFromLlm(
  context: CompanyIntelligenceContext
): Promise<CompanyIntelligenceLlmResult> {
  const userPrompt = buildUserPrompt(context);

  let result;
  try {
    result = await aiService.generateStructured({
      system: SYSTEM_PROMPT,
      prompt: userPrompt,
      model: getModelOverride(),
      temperature: 0.2,
      maxTokens: 4096,
      schema: COMPANY_INTELLIGENCE_SCHEMA,
    });
  } catch (error) {
    if (error instanceof LLMProviderError && error.kind === "configuration") {
      throw new CompanyIntelligenceConfigurationError(error.message);
    }
    throw new LlmRequestError(error instanceof Error ? error.message : String(error));
  }

  return parseAndValidateLlmResponse(JSON.stringify(result.data));
}
