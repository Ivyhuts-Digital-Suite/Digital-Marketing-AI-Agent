import { z } from "zod";
import { aiService } from "../ai/aiService";
import { LLMProviderError } from "../ai/llmErrors";
import {
  parseAndValidateBriefResponse,
  parseAndValidateTopicCandidates,
  RawBriefResponse,
  RawTopicCandidateWithScores,
} from "./contentIntelligenceValidation";
import { ContentAudience, ContentChannel, ContentFormat, ContentGoal, FunnelStage } from "./content.types";
import { ContentIntelligenceConfigurationError, ContentIntelligenceLlmRequestError } from "./errors";
import { ContentGapAnalysis, ContentIntelligenceContext } from "./types";

function getModelOverride(): string | undefined {
  const model = process.env.CONTENT_INTELLIGENCE_MODEL;
  return model && model.trim().length > 0 ? model.trim() : undefined;
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

const FUNNEL_STAGE_ENUM = z.enum(["awareness", "consideration", "conversion", "retention"]);

const TOPIC_CANDIDATES_SCHEMA = z.object({
  topics: z.array(
    z.object({
      topic: z.string(),
      angle: z.string(),
      rationale: z.string(),
      suggestedFunnelStage: FUNNEL_STAGE_ENUM,
      suggestedContentPillar: z.string(),
      relevance: z.number(),
      strategicAlignment: z.number(),
      audienceValue: z.number(),
      novelty: z.number(),
    })
  ),
});

const TOPIC_SYSTEM_PROMPT = `You are a B2B content strategist for a marketing platform.

You ONLY use information explicitly present in the CONTEXT the user provides (company knowledge, strategy, research, content gaps). You never invent specific facts, statistics, competitor names, or market claims that are not present in the CONTEXT.

The four score fields (relevance, strategicAlignment, audienceValue, novelty) are your own qualitative judgment given the CONTEXT, not a claim about external data - reasoning about them is fine even when research data is unavailable, and each is a number from 0 to 100. Do not invent keyword or trend scores; those are intentionally not requested here.`;

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

/** Never fabricates a result: if GEMINI_API_KEY is missing, this throws before making any network call. */
export async function requestTopicCandidates(
  context: ContentIntelligenceContext,
  gaps: ContentGapAnalysis,
  goal: ContentGoal,
  count: number,
  funnelStage?: FunnelStage
): Promise<RawTopicCandidateWithScores[]> {
  const userPrompt = buildTopicDiscoveryPrompt(context, gaps, goal, count, funnelStage);

  let result;
  try {
    result = await aiService.generateStructured({
      system: TOPIC_SYSTEM_PROMPT,
      prompt: userPrompt,
      model: getModelOverride(),
      temperature: 0.5,
      maxTokens: 4096,
      schema: TOPIC_CANDIDATES_SCHEMA,
    });
  } catch (error) {
    if (error instanceof LLMProviderError && error.kind === "configuration") {
      throw new ContentIntelligenceConfigurationError(error.message);
    }
    throw new ContentIntelligenceLlmRequestError(error instanceof Error ? error.message : String(error));
  }

  return parseAndValidateTopicCandidates(JSON.stringify(result.data));
}

const BRIEF_SCHEMA = z.object({
  hook: z.string(),
  coreMessage: z.string(),
  keyPoints: z.array(z.string()),
  cta: z.string(),
  successMetric: z.string(),
  rationale: z.string(),
});

const BRIEF_SYSTEM_PROMPT = `You are a B2B content brief writer for a marketing platform.

You ONLY use information explicitly present in the CONTEXT the user provides. You never invent product claims, statistics, or facts not present in the CONTEXT. You must never include any claim listed under FORBIDDEN CLAIMS, even indirectly.`;

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

/** Never fabricates a result: if GEMINI_API_KEY is missing, this throws before making any network call. */
export async function requestContentBrief(
  context: ContentIntelligenceContext,
  input: BriefPromptInput
): Promise<RawBriefResponse> {
  const userPrompt = buildBriefPrompt(context, input);

  let result;
  try {
    result = await aiService.generateStructured({
      system: BRIEF_SYSTEM_PROMPT,
      prompt: userPrompt,
      model: getModelOverride(),
      temperature: 0.5,
      maxTokens: 2048,
      schema: BRIEF_SCHEMA,
    });
  } catch (error) {
    if (error instanceof LLMProviderError && error.kind === "configuration") {
      throw new ContentIntelligenceConfigurationError(error.message);
    }
    throw new ContentIntelligenceLlmRequestError(error instanceof Error ? error.message : String(error));
  }

  return parseAndValidateBriefResponse(JSON.stringify(result.data));
}
