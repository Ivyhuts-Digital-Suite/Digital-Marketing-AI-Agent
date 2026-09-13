import { ContentAudience, ContentChannel, ContentFormat, FunnelStage } from "./content.types";
import { ContentDecision, ContentIntelligenceContext, ScoredTopicCandidate } from "./types";

/**
 * Instagram-first format guidance, straight from the Phase 7 spec: Reel ->
 * reach/awareness/hooks, Carousel -> education/frameworks, Static Post ->
 * announcements/brand messaging/key insight, Story -> engagement.
 * Deliberately rule-based rather than another LLM call - the PDF itself
 * frames format selection as a logical module, and keeping it rule-based
 * makes it free, deterministic, and auditable.
 */
function selectInstagramFormat(funnelStage: FunnelStage): ContentFormat {
  switch (funnelStage) {
    case "awareness":
      return "instagram_reel";
    case "consideration":
      return "instagram_carousel";
    case "conversion":
      return "instagram_post";
    case "retention":
      return "instagram_story";
    default:
      return "instagram_post";
  }
}

function selectChannelAndFormat(
  context: ContentIntelligenceContext,
  funnelStage: FunnelStage
): { channel: ContentChannel; format: ContentFormat } {
  // Instagram-first per the product's finalized architecture; a real
  // strategy's channel priorities (once one exists) take precedence.
  const preferredChannels: ContentChannel[] =
    context.strategy && context.strategy.channels.length > 0 ? context.strategy.channels : ["instagram"];

  const channel = preferredChannels[0];

  switch (channel) {
    case "instagram":
      return { channel, format: selectInstagramFormat(funnelStage) };
    case "blog":
      return { channel, format: "blog" };
    case "landing_page":
      return { channel, format: "landing_page" };
    case "email":
      return { channel, format: "email" };
    case "paid_marketing":
    default:
      return { channel: "paid_marketing", format: "ad_copy" };
  }
}

function selectAudience(context: ContentIntelligenceContext): ContentAudience {
  if (context.strategy && context.strategy.personas.length > 0) {
    return context.strategy.personas[0];
  }
  const description = context.companyBrain?.targetCustomers[0] ?? "the organization's target customers";
  return { description };
}

/**
 * Step 6: Content Decision Engine.
 *
 * For a single scored topic candidate, decides audience/funnel stage/
 * content pillar/channel/format - the "true intelligence layer" per the
 * spec. Kept rule-based (not an LLM call): cheap, deterministic, and
 * auditable. The angle always comes straight from the topic candidate.
 */
export function decideContentForTopic(
  context: ContentIntelligenceContext,
  candidate: ScoredTopicCandidate
): ContentDecision {
  const { channel, format } = selectChannelAndFormat(context, candidate.suggestedFunnelStage);

  return {
    audience: selectAudience(context),
    funnelStage: candidate.suggestedFunnelStage,
    contentPillar: candidate.suggestedContentPillar,
    channel,
    format,
    angle: candidate.angle,
  };
}
