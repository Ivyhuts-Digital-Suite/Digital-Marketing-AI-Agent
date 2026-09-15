import OpenAI from "openai";
import { IAnalyticsFinding } from "../../../models/AnalyticsFinding";
import { OptimizationAgentConfigurationError, OptimizationAgentLlmRequestError } from "../errors";
import { parseAndValidateOptimizationResponse, RawOptimizationResponse } from "./optimizationAgentValidation";

/**
 * Phase 11 - Step 10/11: Optimization Agent LLM call.
 *
 * Same per-module OpenAI-wrapper convention as the rest of this codebase.
 * Every hypothesis the model returns must cite evidenceRefs (indexes into
 * the finding's own evidence[] array) - the prompt requires it, and
 * optimizationRecommendationService.ts additionally validates every ref is
 * actually in range before persisting anything, so a hypothesis can never
 * end up backed by evidence that doesn't exist.
 */
const DEFAULT_MODEL = "gpt-4o-mini";

function getModel(): string {
  const model = process.env.OPTIMIZATION_AGENT_MODEL;
  return model && model.trim().length > 0 ? model.trim() : DEFAULT_MODEL;
}

function getOpenAiClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.trim().length === 0) {
    throw new OptimizationAgentConfigurationError("OPENAI_API_KEY is not set in the environment");
  }
  return new OpenAI({ apiKey });
}

function sanitizeErrorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  return raw.replace(/sk-[A-Za-z0-9_-]+/g, "[redacted]");
}

const RESPONSE_SCHEMA_DESCRIPTION = `{
  "diagnosis": string,
  "hypotheses": [{ "hypothesis": string, "evidenceRefs": number[] }],
  "recommendedAction": string,
  "expectedImpact": string,
  "confidence": number (0-1),
  "riskLevel": "low" | "medium" | "high",
  "requiredTools": string[]
}`;

const SYSTEM_PROMPT = `You are an optimization reasoning engine for a B2B marketing platform.

You ONLY reason over the FINDING and its numbered EVIDENCE items given below. Every hypothesis you propose MUST cite evidenceRefs - the 0-based indexes of the evidence items (from the numbered list below) that support it. Never propose a hypothesis with no supporting evidence, and never invent an evidence index that wasn't given to you.

"requiredTools" should name the kind of action needed in snake_case (e.g. "publish_instagram_post", "adjust_ad_budget") - you are proposing what should happen, not executing it. You never execute anything yourself.

Respond with a single valid JSON object only - no markdown fences, no commentary, no extra keys - matching exactly this shape:

${RESPONSE_SCHEMA_DESCRIPTION}`;

export function buildOptimizationPrompt(finding: IAnalyticsFinding): string {
  const evidenceLines = finding.evidence
    .map((e, index) => `[${index}] ${e.label}: ${e.value ?? "n/a"}${e.unit ?? ""}`)
    .join("\n");

  return [
    `FINDING TYPE: ${finding.findingType}`,
    `SEVERITY: ${finding.severity}`,
    `METRIC: ${finding.metric}`,
    `OBSERVED VALUE: ${finding.observedValue}`,
    finding.baselineValue !== undefined ? `BASELINE VALUE: ${finding.baselineValue}` : null,
    finding.changePercent !== undefined ? `CHANGE PERCENT: ${finding.changePercent}%` : null,
    `AFFECTED ENTITY: ${finding.affectedEntity.type} - ${finding.affectedEntity.label}`,
    `NUMBERED EVIDENCE:\n${evidenceLines || "(no evidence recorded - hypotheses cannot cite any evidenceRefs)"}`,
    `Diagnose this finding, propose 2-3 evidence-grounded hypotheses, and recommend one action.`,
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n\n");
}

export async function requestOptimizationAnalysis(finding: IAnalyticsFinding): Promise<RawOptimizationResponse> {
  const client = getOpenAiClient();
  const model = getModel();
  const userPrompt = buildOptimizationPrompt(finding);

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
    throw new OptimizationAgentLlmRequestError(sanitizeErrorMessage(error));
  }

  if (!rawText) {
    throw new OptimizationAgentLlmRequestError("the model returned an empty response");
  }

  return parseAndValidateOptimizationResponse(rawText);
}
