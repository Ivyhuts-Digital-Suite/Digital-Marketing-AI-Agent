import { Types } from "mongoose";
import ContentItem from "../../models/ContentItem";
import ContentPlan from "../../models/ContentPlan";
import { ContentBrief, ContentPlanDuration } from "./content.types";
import { generateContentBrief } from "./contentBriefGenerator";
import { gatherContentIntelligenceContext } from "./contentContextService";
import { decideContentForTopic } from "./contentDecisionEngine";
import { analyzeContentGaps } from "./contentGapAnalyzer";
import { validateContentBrief } from "./contentValidationService";
import {
  ContentIntelligenceDatabaseError,
  InvalidContentIntelligenceInputError,
  NoCompanyKnowledgeForContentError,
  NoViableTopicsError,
} from "./errors";
import { discoverTopics } from "./topicDiscoveryService";
import { ExistingContentSummaryItem, GenerateContentPlanInput, GenerateContentPlanResult } from "./types";

const DEFAULT_ITEMS_PER_WEEK = 3;

const DURATION_TO_DAYS: Record<Exclude<ContentPlanDuration, "custom">, number> = {
  "1_week": 7,
  "2_weeks": 14,
  "1_month": 30,
  "3_months": 90,
  "6_months": 180,
};

function resolveDateRange(input: GenerateContentPlanInput): { startDate: Date; endDate: Date } {
  const startDate = input.startDate ?? new Date();

  if (input.duration === "custom") {
    if (!input.endDate) {
      throw new InvalidContentIntelligenceInputError('endDate is required when duration is "custom"');
    }
    if (input.endDate.getTime() <= startDate.getTime()) {
      throw new InvalidContentIntelligenceInputError("endDate must be after startDate");
    }
    return { startDate, endDate: input.endDate };
  }

  const days = DURATION_TO_DAYS[input.duration];
  const endDate = new Date(startDate.getTime() + days * 24 * 60 * 60 * 1000);
  return { startDate, endDate };
}

function spreadDates(startDate: Date, endDate: Date, count: number): Date[] {
  if (count <= 0) return [];
  if (count === 1) return [startDate];

  const totalMs = endDate.getTime() - startDate.getTime();
  const stepMs = totalMs / count;
  return Array.from({ length: count }, (_, i) => new Date(startDate.getTime() + stepMs * i));
}

/**
 * Step 8: 30/60/90-Day Content Plan Generator.
 *
 * Orchestrates Steps 3-7 into a persisted ContentPlan + ContentItem[]:
 * gather context -> analyze gaps -> discover & score topics -> decide
 * audience/funnel/channel/format per topic -> generate each brief ->
 * validate -> persist. Item count is driven by itemsPerWeek x the plan's
 * length, never a hardcoded weekly template - the spec is explicit that
 * "the exact distribution should be decided by strategy, not hardcoded".
 */
export async function generateContentPlan(input: GenerateContentPlanInput): Promise<GenerateContentPlanResult> {
  if (!input.organizationId || !Types.ObjectId.isValid(input.organizationId)) {
    throw new InvalidContentIntelligenceInputError("organizationId is missing or invalid");
  }
  if (input.strategyId && !Types.ObjectId.isValid(input.strategyId)) {
    throw new InvalidContentIntelligenceInputError("strategyId is invalid");
  }
  if (input.campaignId && !Types.ObjectId.isValid(input.campaignId)) {
    throw new InvalidContentIntelligenceInputError("campaignId is invalid");
  }

  const { startDate, endDate } = resolveDateRange(input);
  const itemsPerWeek = input.itemsPerWeek && input.itemsPerWeek > 0 ? input.itemsPerWeek : DEFAULT_ITEMS_PER_WEEK;
  const totalDays = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)));
  const itemCount = Math.max(1, Math.round((totalDays / 7) * itemsPerWeek));

  const context = await gatherContentIntelligenceContext(input.organizationId);

  if (!context.companyBrain) {
    throw new NoCompanyKnowledgeForContentError(input.organizationId);
  }

  const gaps = analyzeContentGaps(context);

  // Discover more candidates than needed so duplicates/validation failures can be dropped.
  const scoredTopics = await discoverTopics(context, gaps, input.goal, Math.max(itemCount * 2, itemCount + 5));
  const selectedTopics = scoredTopics.slice(0, itemCount);

  if (selectedTopics.length === 0) {
    throw new NoViableTopicsError(input.organizationId);
  }

  const scheduledDates = spreadDates(startDate, endDate, selectedTopics.length);
  const planItemsSoFar: ExistingContentSummaryItem[] = [...context.existingContent];
  const validationWarnings: string[] = [];
  const briefsToPersist: { brief: ContentBrief; scheduledDate: Date }[] = [];

  for (let i = 0; i < selectedTopics.length; i++) {
    const candidate = selectedTopics[i];
    const decision = decideContentForTopic(context, candidate);
    const brief = await generateContentBrief(context, input.goal, candidate, decision);

    const validation = validateContentBrief(brief, context, planItemsSoFar);
    validationWarnings.push(...validation.warnings);

    if (!validation.valid) {
      validationWarnings.push(
        `Dropped a candidate for topic "${brief.topic}" due to validation violations: ${validation.violations.join("; ")}`
      );
      continue;
    }

    planItemsSoFar.push({
      topic: brief.topic,
      contentPillar: brief.contentPillar,
      funnelStage: brief.funnelStage,
      channel: brief.channel,
      format: brief.format,
      personaDescription: brief.audience.description,
      status: "draft",
    });

    briefsToPersist.push({ brief, scheduledDate: scheduledDates[i] });
  }

  if (briefsToPersist.length === 0) {
    throw new NoViableTopicsError(input.organizationId);
  }

  try {
    const plan = await ContentPlan.create({
      organizationId: input.organizationId,
      strategyId: input.strategyId,
      campaignId: input.campaignId,
      duration: input.duration,
      startDate,
      endDate,
      objectives: [input.goal],
      status: "draft",
    });

    await ContentItem.insertMany(
      briefsToPersist.map(({ brief, scheduledDate }) => ({
        contentPlanId: plan._id,
        organizationId: input.organizationId,
        goal: brief.goal,
        persona: brief.audience,
        funnelStage: brief.funnelStage,
        contentPillar: brief.contentPillar,
        topic: brief.topic,
        angle: brief.angle,
        channel: brief.channel,
        format: brief.format,
        hook: brief.hook,
        message: brief.coreMessage,
        cta: brief.cta,
        rationale: brief.rationale,
        evidence: brief.evidence ?? [],
        scheduledDate,
        status: "draft",
      }))
    );

    return {
      contentPlanId: plan._id.toString(),
      itemCount: briefsToPersist.length,
      startDate,
      endDate,
      warnings: context.warnings,
      validationWarnings,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new ContentIntelligenceDatabaseError(`failed to persist content plan: ${message}`);
  }
}
