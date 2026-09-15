import OpenAI from "openai";
import { IAnalyticsFinding } from "../../../models/AnalyticsFinding";
import { AnalyticsAgentConfigurationError, AnalyticsAgentLlmRequestError } from "../errors";
import { AnalyticsInterpretation, parseAndValidateAnalyticsInterpretation } from "./analyticsAgentValidation";

/**
 * Phase 11 - Step 9: Analytics Agent LLM call.
 *
 * Follows the same per-module OpenAI-wrapper convention already
 * established by companyIntelligenceLlm.ts and contentIntelligenceLlm.ts
 * (this codebase has no shared AIService/LLMProvider abstraction to reuse -
 * see the Step 0 audit). Receives only a structured, already-computed
 * AnalyticsFinding - never a raw provider payload, never queries anything
 * itself.
 */
const DEFAULT_MODEL = "gpt-4o-mini";

function getModel(): string {
  const model = process.env.ANALYTICS_AGENT_MODEL;
  return model && model.trim().length > 0 ? model.trim() : DEFAULT_MODEL;
}

function getOpenAiClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.trim().length === 0) {
    throw new AnalyticsAgentConfigurationError("OPENAI_API_KEY is not set in the environment");
  }
  return new OpenAI({ apiKey });
}

function sanitizeErrorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  return raw.replace(/sk-[A-Za-z0-9_-]+/g, "[redacted]");
}

const RESPONSE_SCHEMA_DESCRIPTION = `{
  "interpretation": string,
  "possibleCauses": string[],
  "businessImpact": string
}`;

const SYSTEM_PROMPT = `You are an analytics interpretation engine for a B2B marketing platform.

You ONLY reason over the FINDING and its EVIDENCE given to you below. You have no access to raw data and must never invent a number, metric, or piece of evidence that isn't explicitly present. If the evidence is insufficient to confidently explain the finding, say so honestly in "possibleCauses" rather than fabricating a cause.

Respond with a single valid JSON object only - no markdown fences, no commentary, no extra keys - matching exactly this shape:

${RESPONSE_SCHEMA_DESCRIPTION}`;

export function buildFindingPrompt(finding: IAnalyticsFinding): string {
  const evidenceLines = finding.evidence.map((e) => `- ${e.label}: ${e.value ?? "n/a"}${e.unit ?? ""}`).join("\n");

  return [
    `FINDING TYPE: ${finding.findingType}`,
    `SEVERITY: ${finding.severity}`,
    `METRIC: ${finding.metric}`,
    `OBSERVED VALUE: ${finding.observedValue}`,
    finding.baselineValue !== undefined ? `BASELINE VALUE: ${finding.baselineValue}` : null,
    finding.changePercent !== undefined ? `CHANGE PERCENT: ${finding.changePercent}%` : null,
    `AFFECTED ENTITY: ${finding.affectedEntity.type} - ${finding.affectedEntity.label}`,
    `EVIDENCE:\n${evidenceLines || "(no additional evidence recorded)"}`,
    `Explain what this finding means, what might explain it (grounded only in the evidence above), and its likely business impact.`,
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n\n");
}

export async function requestAnalyticsInterpretation(finding: IAnalyticsFinding): Promise<AnalyticsInterpretation> {
  const client = getOpenAiClient();
  const model = getModel();
  const userPrompt = buildFindingPrompt(finding);

  let rawText: string | null | undefined;
  try {
    const response = await client.chat.completions.create({
      model,
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });
    rawText = response.choices[0]?.message?.content;
  } catch (error) {
    throw new AnalyticsAgentLlmRequestError(sanitizeErrorMessage(error));
  }

  if (!rawText) {
    throw new AnalyticsAgentLlmRequestError("the model returned an empty response");
  }

  return parseAndValidateAnalyticsInterpretation(rawText);
}
