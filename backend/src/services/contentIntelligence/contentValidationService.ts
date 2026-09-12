import { ContentBrief } from "./content.types";
import { ContentIntelligenceContext, ContentValidationResult, ExistingContentSummaryItem } from "./types";

/** Same topic repeated more than this many times within one plan triggers a warning. */
const DIVERSITY_TOPIC_LIMIT = 2;
/** Same channel+format combination used more than this many times within one plan triggers a warning. */
const DIVERSITY_FORMAT_LIMIT = 4;

/**
 * Step 9: Validation.
 *
 * Checks a generated ContentBrief against real, available signals only:
 * forbidden claims from the real BrandProfile/CompanyIntelligence, the
 * strategy's funnel priorities when a strategy exists, and diversity
 * against the items already accepted into this plan. Never invents a rule
 * against strategy/brand data that isn't actually present - when
 * context.strategy is null (the common case right now), the funnel-
 * alignment check is skipped entirely rather than guessed at.
 */
export function validateContentBrief(
  brief: ContentBrief,
  context: ContentIntelligenceContext,
  planItemsSoFar: ExistingContentSummaryItem[]
): ContentValidationResult {
  const violations: string[] = [];
  const warnings: string[] = [];

  const forbiddenClaims = context.companyBrain?.forbiddenClaims ?? [];
  const textToCheck = `${brief.hook} ${brief.coreMessage} ${brief.keyPoints.join(" ")}`.toLowerCase();
  for (const claim of forbiddenClaims) {
    const normalized = claim.trim().toLowerCase();
    if (normalized.length > 0 && textToCheck.includes(normalized)) {
      violations.push(`Brief includes a forbidden claim: "${claim}"`);
    }
  }

  if (context.strategy && context.strategy.funnelPriorities.length > 0) {
    if (!context.strategy.funnelPriorities.includes(brief.funnelStage)) {
      warnings.push(`Funnel stage "${brief.funnelStage}" is not one of the strategy's funnel priorities.`);
    }
  }

  const topicCount = planItemsSoFar.filter((item) => item.topic.toLowerCase() === brief.topic.toLowerCase()).length;
  if (topicCount >= DIVERSITY_TOPIC_LIMIT) {
    warnings.push(`Topic "${brief.topic}" is being repeated within this plan.`);
  }

  const formatCount = planItemsSoFar.filter(
    (item) => item.channel === brief.channel && item.format === brief.format
  ).length;
  if (formatCount >= DIVERSITY_FORMAT_LIMIT) {
    warnings.push(`Format "${brief.channel}/${brief.format}" is being overused within this plan.`);
  }

  return { valid: violations.length === 0, violations, warnings };
}
