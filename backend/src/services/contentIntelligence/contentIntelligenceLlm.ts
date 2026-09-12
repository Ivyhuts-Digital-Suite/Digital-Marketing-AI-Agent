import OpenAI from "openai";
import {
  parseAndValidateBriefResponse,
  parseAndValidateTopicCandidates,
  RawBriefResponse,
  RawTopicCandidateWithScores,
} from "./contentIntelligenceValidation";
import { ContentAudience, ContentChannel, ContentFormat, ContentGoal, FunnelStage } from "./content.types";
import { ContentIntelligenceConfigurationError, ContentIntelligenceLlmRequestError } from "./errors";
import { ContentGapAnalysis, ContentIntelligenceContext } from "./types";

const DEFAULT_MODEL = "gpt-4o-mini";

function getModel(): string {
  const model = process.env.CONTENT_INTELLIGENCE_MODEL;
  return model && model.trim().length > 0 ? model.trim() : DEFAULT_MODEL;
}

function getOpenAiClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.trim().length === 0) {
    throw new ContentIntelligenceConfigurationError("OPENAI_API_KEY is not set in the environment");
  }
  return new OpenAI({ apiKey });
}

/** Strips anything that looks like an API key before an error can surface it. */
function sanitizeErrorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  return raw.replace(/sk-[A-Za-z0-9_-]+/g, "[redacted]");
}

function formatCompanyBrain(context: ContentIntelligenceContext): string {
  const brain = context.companyBrain;
  if (!brain) return "(no company knowledge is available yet)";
  const lines = [
    brain.companyOverview ? `Overview: ${brain.companyOverview}` : null,
    brain.industry ? `Industry: ${brain.industry}` : null,
    brain.targetCustomers.length ? `Target customers: ${brain.targetCustomers.join("; ")}` : null,
    brain.customerProblems.length ? `Customer problems: ${brain.customerProblems.join("; ")}` : null,
    brain.differentiators.length ? `Differentiators: ${brain.differentiators.join("; ")}` : null,
    brain.valuePropositions.length ? `Value propositions: ${brain.valuePropositions.join("; ")}` : null,
    brain.brandVoice ? `Brand voice: ${brain.brandVoice}` : null,
    brain.products.length ? `Products: ${brain.products.map((p) => p.name).join(", ")}` : null,
    brain.services.length ? `Services: ${brain.services.map((s) => s.name).join(", ")}` : null,
  ].filter((line): line is string => Boolean(line));
  return lines.length > 0 ? lines.join("\n") : "(no company knowledge is available yet)";
}

function formatStrategy(context: ContentIntelligenceContext): string {
  const strategy = context.strategy;
  if (!strategy) return "(no marketing strategy is available yet)";
  const lines = [
    strategy.icp ? `ICP: ${strategy.icp}` : null,
    strategy.positioning ? `Positioning: ${strategy.positioning}` : null,
    strategy.contentPillars.length ? `Content pillars: ${strategy.contentPillars.join(", ")}` : null,
    strategy.messagingFramework.length ? `Messaging framework: ${strategy.messagingFramework.join("; ")}` : null,
  ].filter((line): line is string => Boolean(line));
  return lines.length > 0 ? lines.join("\n") : "(no marketing strategy is available yet)";
}

function formatResearch(context: ContentIntelligenceContext): string {
  const research = context.research;
  if (!research) return "(no research intelligence is available yet)";
  const lines = [
    research.marketInsights.length ? `Market insights: ${research.marketInsights.join("; ")}` : null,
    research.competitorInsights.length ? `Competitor insights: ${research.competitorInsights.join("; ")}` : null,
    research.keywordOpportunities.length ? `Keyword opportunities: ${research.keywordOpportunities.join("; ")}` : null,
    research.trendInsights.length ? `Trend insights: ${research.trendInsights.join("; ")}` : null,
    research.audienceInsights.length ? `Audience insights: ${research.audienceInsights.join("; ")}` : null,
  ].filter((line): line is string => Boolean(line));
  return lines.length > 0 ? lines.join("\n") : "(no research intelligence is available yet)";
}

function formatGapAnalysis(gaps: ContentGapAnalysis): string {
  return gaps.recommendedFocus.length > 0 ? gaps.recommendedFocus.join("\n") : "(no content history yet - no gaps computed)";
}

const TOPIC_SCHEMA_DESCRIPTION = `{
  "topics": [
    {
      "topic": string,
      "angle": string,
      "rationale": string,
      "suggestedFunnelStage": "awareness" | "consideration" | "conversion" | "retention",
      "suggestedContentPillar": string,
      "relevance": number (0-100),
      "strategicAlignment": number (0-100),
      "audienceValue": number (0-100),
      "novelty": number (0-100)
    }
  ]
}`;

const TOPIC_SYSTEM_PROMPT = `You are a B2B content strategist for a marketing platform.

You ONLY use information explicitly present in the CONTEXT the user provides (company knowledge, strategy, research, content gaps). You never invent specific facts, statistics, competitor names, or market claims that are not present in the CONTEXT.

The four score fields (relevance, strategicAlignment, audienceValue, novelty) are your own qualitative judgment given the CONTEXT, not a claim about external data - reasoning about them is fine even when research data is unavailable. Do not invent keyword or trend scores; those are intentionally not requested here.

Respond with a single valid JSON object only - no markdown fences, no commentary, no extra keys - matching exactly this shape:

${TOPIC_SCHEMA_DESCRIPTION}`;

/** Pure/testable prompt builder - no network call. */
export function buildTopicDiscoveryPrompt(
  context: ContentIntelligenceContext,
  gaps: ContentGapAnalysis,
  goal: ContentGoal,
  count: number,
  funnelStage?: FunnelStage
): string {
  return [
    `GOAL: ${goal}`,
    funnelStage ? `REQUESTED FUNNEL STAGE: ${funnelStage}` : null,
    `COMPANY BRAIN:\n${formatCompanyBrain(context)}`,
    `MARKETING STRATEGY:\n${formatStrategy(context)}`,
    `RESEARCH INTELLIGENCE:\n${formatResearch(context)}`,
    `CONTENT GAPS:\n${formatGapAnalysis(gaps)}`,
    `Generate ${count} distinct content topic candidates for this goal, grounded in the CONTEXT above. Prioritize closing the content gaps listed. Do not repeat overused topics.`,
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n\n");
}

/** Never fabricates a result: if OPENAI_API_KEY is missing, this throws before making any network call. */
export async function requestTopicCandidates(
  context: ContentIntelligenceContext,
  gaps: ContentGapAnalysis,
  goal: ContentGoal,
  count: number,
  funnelStage?: FunnelStage
): Promise<RawTopicCandidateWithScores[]> {
  const client = getOpenAiClient();
  const model = getModel();
  const userPrompt = buildTopicDiscoveryPrompt(context, gaps, goal, count, funnelStage);

  let rawText: string | null | undefined;
  try {
    const response = await client.chat.completions.create({
      model,
      temperature: 0.5,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: TOPIC_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });
    rawText = response.choices[0]?.message?.content;
  } catch (error) {
    throw new ContentIntelligenceLlmRequestError(sanitizeErrorMessage(error));
  }

  if (!rawText) {
    throw new ContentIntelligenceLlmRequestError("the model returned an empty response");
  }

  return parseAndValidateTopicCandidates(rawText);
}

const BRIEF_SCHEMA_DESCRIPTION = `{
  "hook": string,
  "coreMessage": string,
  "keyPoints": string[],
  "cta": string,
  "successMetric": string,
  "rationale": string
}`;

const BRIEF_SYSTEM_PROMPT = `You are a B2B content brief writer for a marketing platform.

You ONLY use information explicitly present in the CONTEXT the user provides. You never invent product claims, statistics, or facts not present in the CONTEXT. You must never include any claim listed under FORBIDDEN CLAIMS, even indirectly.

Respond with a single valid JSON object only - no markdown fences, no commentary, no extra keys - matching exactly this shape:

${BRIEF_SCHEMA_DESCRIPTION}`;

export interface BriefPromptInput {
  goal: ContentGoal;
  audience: ContentAudience;
  funnelStage: FunnelStage;
  contentPillar: string;
  topic: string;
  angle: string;
  channel: ContentChannel;
  format: ContentFormat;
}

/** Pure/testable prompt builder - no network call. */
export function buildBriefPrompt(context: ContentIntelligenceContext, input: BriefPromptInput): string {
  const brain = context.companyBrain;
  return [
    `GOAL: ${input.goal}`,
    `AUDIENCE: ${input.audience.description}`,
    `FUNNEL STAGE: ${input.funnelStage}`,
    `CONTENT PILLAR: ${input.contentPillar}`,
    `TOPIC: ${input.topic}`,
    `ANGLE: ${input.angle}`,
    `CHANNEL: ${input.channel}`,
    `FORMAT: ${input.format}`,
    `COMPANY BRAIN:\n${formatCompanyBrain(context)}`,
    brain && brain.forbiddenClaims.length > 0
      ? `FORBIDDEN CLAIMS (never include, even indirectly): ${brain.forbiddenClaims.join("; ")}`
      : null,
    brain && brain.allowedClaims.length > 0 ? `ALLOWED CLAIMS: ${brain.allowedClaims.join("; ")}` : null,
    `Write the hook, core message, key points, CTA, success metric, and rationale for this specific piece of content.`,
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n\n");
}

/** Never fabricates a result: if OPENAI_API_KEY is missing, this throws before making any network call. */
export async function requestContentBrief(
  context: ContentIntelligenceContext,
  input: BriefPromptInput
): Promise<RawBriefResponse> {
  const client = getOpenAiClient();
  const model = getModel();
  const userPrompt = buildBriefPrompt(context, input);

  let rawText: string | null | undefined;
  try {
    const response = await client.chat.completions.create({
      model,
      temperature: 0.5,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: BRIEF_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });
    rawText = response.choices[0]?.message?.content;
  } catch (error) {
    throw new ContentIntelligenceLlmRequestError(sanitizeErrorMessage(error));
  }

  if (!rawText) {
    throw new ContentIntelligenceLlmRequestError("the model returned an empty response");
  }

  return parseAndValidateBriefResponse(rawText);
}
