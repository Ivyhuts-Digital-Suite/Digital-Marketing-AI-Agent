import { z } from "zod";
import { Types } from "mongoose";
import { aiService } from "../ai/aiService";
import { LLMProviderError } from "../ai/llmErrors";
import CreativeAsset, { ICreativeAsset } from "../../models/CreativeAsset";
import ContentQualityCheck, { IContentQualityCheck } from "../../models/ContentQualityCheck";
import { gatherContentIntelligenceContext } from "../contentIntelligence/contentContextService";
import { containsForbiddenClaim } from "./brandValidationService";
import { resolveItemById } from "./contentResolver.service";
import { getCreativeBriefForItem } from "./creativeBriefService";
import {
  ContentQualityCheckNotFoundError,
  ContentStudioDatabaseError,
  CreativeBriefNotFoundError,
  QualityCheckConfigurationError,
} from "./errors";
import { promoteToReviewOnQualityPass } from "./contentLifecycleService";

/**
 * Phase 9 - Step 4/12/21: AI Content Quality Check.
 *
 * Reuses the existing shared `aiService` (services/ai/aiService.ts) - no
 * second LLM client. The response is validated against a Zod schema before
 * any of it is trusted (never raw LLM JSON), and the overall score/PASS-FAIL
 * gate is computed deterministically in this file from the validated
 * per-category scores - never trusted as a single number the model made up.
 * A forbidden-claim hit is always an automatic FAIL, regardless of score.
 */

const PASS_SCORE_THRESHOLD = 70;

const categorySchema = z.object({
  passed: z.boolean(),
  score: z.number().min(0).max(100),
  notes: z.array(z.string()),
});

const qualityCheckResponseSchema = z.object({
  strategyAlignment: categorySchema,
  messaging: categorySchema,
  brandSafety: categorySchema,
  instagramFit: categorySchema,
  graphics: categorySchema.optional(),
  video: categorySchema.optional(),
  flaggedClaims: z.array(
    z.object({
      claim: z.string(),
      type: z.enum(["forbidden", "unsupported"]),
      reason: z.string(),
    })
  ),
  issues: z.array(z.string()),
  warnings: z.array(z.string()),
  recommendations: z.array(z.string()),
});

type QualityCheckLlmResponse = z.infer<typeof qualityCheckResponseSchema>;

interface QualityCheckLlmOutcome {
  data: QualityCheckLlmResponse;
  model: string;
  usage: { inputTokens?: number; outputTokens?: number; totalTokens?: number };
}

const SYSTEM_PROMPT = `You are a content quality reviewer for a B2B Instagram marketing platform.

You ONLY reason over the CONTEXT given below. You never invent facts about the company, its claims, its strategy, or its audience. A claim in the content is "unsupported" only if the COMPANY CONTEXT genuinely does not back it up - do not guess a claim is unsupported just because it sounds strong; do not guess it is supported just because it sounds plausible.

Score every category 0-100 and set passed=true only when the category is genuinely strong. Be honest, not generous - a mediocre hook should not score 90.

Respond with a single valid JSON object only - no markdown fences, no commentary - matching exactly this shape:

{
  "strategyAlignment": { "passed": boolean, "score": number, "notes": string[] },
  "messaging": { "passed": boolean, "score": number, "notes": string[] },
  "brandSafety": { "passed": boolean, "score": number, "notes": string[] },
  "instagramFit": { "passed": boolean, "score": number, "notes": string[] },
  "graphics": { "passed": boolean, "score": number, "notes": string[] } | omit if no graphic asset exists,
  "video": { "passed": boolean, "score": number, "notes": string[] } | omit if no video asset exists,
  "flaggedClaims": [{ "claim": string, "type": "forbidden" | "unsupported", "reason": string }],
  "issues": string[],
  "warnings": string[],
  "recommendations": string[]
}`;

interface QualityCheckPromptInputs {
  itemSummary: string;
  briefSummary: string;
  companyBrainSummary: string;
  strategySummary: string;
  assetSummary: string;
}

function buildPrompt(inputs: QualityCheckPromptInputs): string {
  return [
    `CONTENT ITEM:\n${inputs.itemSummary}`,
    `CREATIVE BRIEF:\n${inputs.briefSummary}`,
    `COMPANY CONTEXT:\n${inputs.companyBrainSummary}`,
    `STRATEGY CONTEXT:\n${inputs.strategySummary}`,
    `GENERATED ASSETS:\n${inputs.assetSummary}`,
    `Evaluate this content package per the categories in your instructions.`,
  ].join("\n\n");
}

function assetSummaryFor(assets: ICreativeAsset[]): string {
  if (assets.length === 0) return "(no assets generated yet)";
  return assets
    .map((a) => {
      const validation = a.validation
        ? ` | brand validation: ${a.validation.passed ? "passed" : "issues found"} (${a.validation.issues.join("; ") || "none"})`
        : "";
      const mock = a.metadata?.isMock ? " | MOCK/development output" : "";
      return `- ${a.type}${a.subtype ? `/${a.subtype}` : ""}, status=${a.status}${validation}${mock}`;
    })
    .join("\n");
}

async function requestQualityCheck(inputs: QualityCheckPromptInputs): Promise<QualityCheckLlmOutcome> {
  try {
    const result = await aiService.generateStructured({
      system: SYSTEM_PROMPT,
      prompt: buildPrompt(inputs),
      schema: qualityCheckResponseSchema,
      temperature: 0.2,
    });
    return { data: result.data, model: result.model, usage: result.usage };
  } catch (error) {
    if (error instanceof LLMProviderError && error.kind === "configuration") {
      throw new QualityCheckConfigurationError(error.message);
    }
    throw error;
  }
}

/** Deterministic, from validated categories only - never the LLM's own idea of an aggregate score. */
function computeOverallScore(response: QualityCheckLlmResponse): number {
  const categories = [response.strategyAlignment, response.messaging, response.brandSafety, response.instagramFit, response.graphics, response.video].filter(
    (c): c is z.infer<typeof categorySchema> => Boolean(c)
  );
  const sum = categories.reduce((total, c) => total + c.score, 0);
  return Math.round(sum / categories.length);
}

function computeStatus(response: QualityCheckLlmResponse, overallScore: number): "PASS" | "FAIL" {
  const hasForbiddenClaim = response.flaggedClaims.some((c) => c.type === "forbidden");
  const categories = [response.strategyAlignment, response.messaging, response.brandSafety, response.instagramFit, response.graphics, response.video].filter(
    (c): c is z.infer<typeof categorySchema> => Boolean(c)
  );
  const allCategoriesPassed = categories.every((c) => c.passed);

  if (hasForbiddenClaim) return "FAIL";
  if (!allCategoriesPassed) return "FAIL";
  if (overallScore < PASS_SCORE_THRESHOLD) return "FAIL";
  return "PASS";
}

/**
 * Runs a full quality check for one ContentItem, persists the report, and
 * - only on a genuine PASS - promotes approvalStatus draft -> review via
 * contentLifecycleService (never approves anything itself).
 */
export async function runQualityCheck(userId: string, contentItemId: unknown): Promise<IContentQualityCheck> {
  const item = await resolveItemById(userId, contentItemId);

  const brief = await getCreativeBriefForItem(item._id as Types.ObjectId);
  if (!brief) {
    throw new CreativeBriefNotFoundError(item._id.toString());
  }

  const [context, assets] = await Promise.all([
    gatherContentIntelligenceContext(item.organizationId.toString()),
    CreativeAsset.find({ contentItemId: item._id }),
  ]);

  const hasGraphicAsset = assets.some((a) => a.type === "graphic" || a.type === "image");
  const hasVideoAsset = assets.some((a) => a.type === "video");

  const brain = context.companyBrain;
  const companyBrainSummary = brain
    ? [
        brain.companyOverview ? `Overview: ${brain.companyOverview}` : null,
        brain.brandVoice ? `Brand voice: ${brain.brandVoice}` : null,
        brain.allowedClaims.length ? `Allowed claims: ${brain.allowedClaims.join("; ")}` : null,
        brain.forbiddenClaims.length ? `Forbidden claims: ${brain.forbiddenClaims.join("; ")}` : null,
        brain.differentiators.length ? `Differentiators: ${brain.differentiators.join("; ")}` : null,
      ]
        .filter((line): line is string => Boolean(line))
        .join("\n") || "(no company knowledge is available yet)"
    : "(no company knowledge is available yet)";

  const strategy = context.strategy;
  const strategySummary = strategy
    ? [
        strategy.positioning ? `Positioning: ${strategy.positioning}` : null,
        strategy.contentPillars.length ? `Content pillars: ${strategy.contentPillars.join(", ")}` : null,
        strategy.funnelPriorities.length ? `Funnel priorities: ${strategy.funnelPriorities.join(", ")}` : null,
      ]
        .filter((line): line is string => Boolean(line))
        .join("\n") || "(no marketing strategy is available yet)"
    : "(no marketing strategy is available yet)";

  const itemSummary = [
    `Goal: ${item.goal}`,
    `Funnel stage: ${item.funnelStage}`,
    `Content pillar: ${item.contentPillar}`,
    `Audience: ${item.persona.description}`,
    `Topic: ${item.topic}`,
    `Angle: ${item.angle}`,
    `Channel/format: ${item.channel}/${item.format}`,
  ].join("\n");

  const briefSummary = [
    `Hook: ${brief.hook}`,
    `Core message: ${brief.coreMessage}`,
    `Key points: ${brief.keyPoints.join("; ")}`,
    `CTA: ${brief.cta}`,
    `Tone of voice: ${brief.toneOfVoice ?? "(not set)"}`,
  ].join("\n");

  const outcome = await requestQualityCheck({
    itemSummary,
    briefSummary,
    companyBrainSummary,
    strategySummary,
    assetSummary: assetSummaryFor(assets),
  });
  const response = outcome.data;

  // Deterministic safety net: a forbidden claim the model missed is never silently dropped.
  const briefText = [brief.hook, brief.coreMessage, ...brief.keyPoints, brief.cta].join(" ");
  const missedForbiddenHits = containsForbiddenClaim(briefText, brain?.forbiddenClaims ?? []).filter(
    (claim) => !response.flaggedClaims.some((f) => f.claim.toLowerCase() === claim.toLowerCase())
  );
  const flaggedClaims = [
    ...response.flaggedClaims,
    ...missedForbiddenHits.map((claim) => ({
      claim,
      type: "forbidden" as const,
      reason: "Matched a forbidden claim from Company Intelligence via deterministic text match.",
    })),
  ];

  const overallScore = computeOverallScore(response);
  const status = computeStatus({ ...response, flaggedClaims }, overallScore);

  let record: IContentQualityCheck;
  try {
    record = await ContentQualityCheck.create({
      organizationId: item.organizationId,
      contentPlanId: item.contentPlanId,
      contentItemId: item._id,
      creativeBriefId: brief._id,
      assetIds: assets.map((a) => a._id),
      score: overallScore,
      status,
      checks: {
        strategyAlignment: response.strategyAlignment,
        messaging: response.messaging,
        brandSafety: response.brandSafety,
        instagramFit: response.instagramFit,
        ...(hasGraphicAsset && response.graphics ? { graphics: response.graphics } : {}),
        ...(hasVideoAsset && response.video ? { video: response.video } : {}),
      },
      flaggedClaims,
      issues: response.issues,
      warnings: response.warnings,
      recommendations: response.recommendations,
      checkedAt: new Date(),
      aiModel: outcome.model,
      usage: outcome.usage,
    });
  } catch (error) {
    throw new ContentStudioDatabaseError(`failed to persist quality check: ${error instanceof Error ? error.message : String(error)}`);
  }

  if (status === "PASS") {
    await promoteToReviewOnQualityPass(item.organizationId.toString(), item._id.toString());
  }

  return record;
}

export async function getLatestQualityCheck(userId: string, contentItemId: unknown): Promise<IContentQualityCheck> {
  const item = await resolveItemById(userId, contentItemId);

  let record: IContentQualityCheck | null;
  try {
    record = await ContentQualityCheck.findOne({ contentItemId: item._id }).sort({ checkedAt: -1 });
  } catch (error) {
    throw new ContentStudioDatabaseError(`failed to load quality check: ${error instanceof Error ? error.message : String(error)}`);
  }

  if (!record) {
    throw new ContentQualityCheckNotFoundError(item._id.toString());
  }
  return record;
}
