import OpenAI from "openai";
import { CompanyIntelligenceConfigurationError, LlmRequestError } from "./errors";
import { CompanyIntelligenceContext, CompanyIntelligenceLlmResult } from "./types";
import { parseAndValidateLlmResponse } from "./companyIntelligenceValidation";

const DEFAULT_MODEL = "gpt-4o-mini";

const RESPONSE_SCHEMA_DESCRIPTION = `{
  "companyOverview": string,
  "industry": string,
  "targetCustomers": string[],
  "customerProblems": string[],
  "products": [{ "name": string, "description": string, "targetAudience": string, "problemsSolved": string[], "benefits": string[], "differentiators": string[] }],
  "services": [{ "name": string, "description": string, "targetAudience": string, "problemsSolved": string[], "benefits": string[], "differentiators": string[] }],
  "differentiators": string[],
  "competitors": string[],
  "valuePropositions": string[],
  "brandVoice": string,
  "marketingMessaging": string[],
  "allowedClaims": string[],
  "forbiddenClaims": string[],
  "importantFacts": string[]
}`;

const SYSTEM_PROMPT = `You are a precise company-intelligence extraction engine for a marketing platform.

You ONLY use information explicitly present in the "COMPANY CONTEXT" the user provides. You never use outside/general knowledge about any company, even if the name looks familiar.

Rules:
- If a fact is not present in the context, represent it as an empty string, empty array, or "unknown" - never invent, guess, or assume it.
- Do not copy marketing fluff verbatim if it is not a factual claim; keep the extracted content grounded in what the context actually says.
- "allowedClaims" are things the context supports the company saying about itself. "forbiddenClaims" are claims the context explicitly rules out, warns against, or contradicts - leave it empty if nothing like that is present.
- Respond with a single valid JSON object only - no markdown fences, no commentary, no extra keys - matching exactly this shape:

${RESPONSE_SCHEMA_DESCRIPTION}`;

function sanitizeErrorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  return raw.replace(/sk-[A-Za-z0-9_-]+/g, "[redacted]");
}

function getModel(): string {
  const model = process.env.COMPANY_INTELLIGENCE_MODEL;
  return model && model.trim().length > 0 ? model.trim() : DEFAULT_MODEL;
}

function getOpenAiClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.trim().length === 0) {
    throw new CompanyIntelligenceConfigurationError("OPENAI_API_KEY is not set in the environment");
  }
  return new OpenAI({ apiKey });
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
 * Calls the LLM and returns its validated, structured response. Exported
 * separately from the orchestrating service so it can be exercised
 * directly in tests without needing a database. Never fabricates a
 * result: if OPENAI_API_KEY is missing, this throws before making any
 * network call.
 */
export async function requestCompanyIntelligenceFromLlm(
  context: CompanyIntelligenceContext
): Promise<CompanyIntelligenceLlmResult> {
  const client = getOpenAiClient();
  const model = getModel();
  const userPrompt = buildUserPrompt(context);

  let rawText: string | null | undefined;
  try {
    const response = await client.chat.completions.create({
      model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });
    rawText = response.choices[0]?.message?.content;
  } catch (error) {
    throw new LlmRequestError(sanitizeErrorMessage(error));
  }

  if (!rawText) {
    throw new LlmRequestError("the model returned an empty response");
  }

  return parseAndValidateLlmResponse(rawText);
}
