import { Types } from "mongoose";
import ContentItem, { IContentItem } from "../../models/ContentItem";
import { IContentPlan } from "../../models/ContentPlan";
import CreativeBrief, { CreativeBriefAspectRatio, ICreativeBrief } from "../../models/CreativeBrief";
import { ISourceReference, SourceReferenceType } from "../../models/common/sourceReference";
import { gatherContentIntelligenceContext } from "../contentIntelligence/contentContextService";
import { assertOrganizationMembership } from "../../middleware/organization.middleware";
import { requestCreativeDirection } from "./creativeBriefLlm";
import { ContentItemNotFoundError, ContentStudioDatabaseError, InvalidContentStudioInputError } from "./errors";
import { resolvePlanAndItem } from "./contentResolver.service";

/**
 * Platform aspect ratios are a backend/technical decision tied to what
 * Instagram actually supports per format, not a creative judgment call -
 * the LLM is never asked for this. Reels/stories are full-screen vertical;
 * posts/carousels use IG's 4:5 "maximum real estate" portrait ratio.
 */
function resolveAspectRatio(format: string): CreativeBriefAspectRatio {
  switch (format) {
    case "instagram_reel":
    case "instagram_story":
      return "9:16";
    case "instagram_post":
    case "instagram_carousel":
    default:
      return "4:5";
  }
}

function buildSourceReferences(item: IContentItem): ISourceReference[] {
  return item.evidence.map((evidence) => {
    const sourceType: SourceReferenceType = evidence.chunkId
      ? "knowledge_chunk"
      : evidence.url
      ? "website"
      : "document";
    return {
      sourceType,
      sourceId: evidence.sourceId,
      url: evidence.url,
      label: evidence.label,
    };
  });
}

/**
 * Generates (or regenerates) the Creative Brief for one ContentItem.
 *
 * Every ownership/marketing-content field (organizationId, contentPlanId,
 * contentItemId, platform, format, objective, targetAudience, funnelStage,
 * contentPillar, topic, angle, hook, coreMessage, keyPoints, cta,
 * aspectRatio) is copied verbatim from the already-validated ContentItem
 * and ContentPlan documents by this function - never read from the LLM's
 * response. The LLM (requestCreativeDirection) only ever fills in
 * toneOfVoice, visualDirection's descriptive fields, and
 * generationRequirements.
 */
export async function generateCreativeBrief(plan: IContentPlan, item: IContentItem): Promise<ICreativeBrief> {
  const context = await gatherContentIntelligenceContext(plan.organizationId.toString());
  const direction = await requestCreativeDirection(item, context.companyBrain);

  const existing = await CreativeBrief.findOne({ contentItemId: item._id });
  const nextVersion = existing ? existing.version + 1 : 1;

  try {
    const brief = await CreativeBrief.findOneAndUpdate(
      { contentItemId: item._id },
      {
        $set: {
          organizationId: plan.organizationId,
          contentPlanId: plan._id,
          platform: "instagram",
          format: item.format,
          objective: item.goal,
          targetAudience: item.persona.description,
          funnelStage: item.funnelStage,
          contentPillar: item.contentPillar,

          topic: item.topic,
          angle: item.angle,
          hook: item.hook,
          coreMessage: item.message,
          keyPoints: item.keyPoints,
          cta: item.cta,

          toneOfVoice: direction.toneOfVoice,
          brandContext: {
            brandVoice: context.companyBrain?.brandVoice,
            allowedClaims: context.companyBrain?.allowedClaims ?? [],
            forbiddenClaims: context.companyBrain?.forbiddenClaims ?? [],
          },
          visualDirection: {
            ...direction.visualDirection,
            aspectRatio: resolveAspectRatio(item.format),
          },
          generationRequirements: direction.generationRequirements,

          sourceReferences: buildSourceReferences(item),
          status: "ready",
          version: nextVersion,
        },
        $setOnInsert: { contentItemId: item._id },
      },
      { upsert: true, new: true }
    );

    if (item.status === "draft" || item.status === "scheduled" || item.status === "planned") {
      item.status = "brief_ready";
      await item.save();
    }

    return brief;
  } catch (error) {
    throw new ContentStudioDatabaseError(
      `failed to save creative brief: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export async function getCreativeBriefForItem(contentItemId: Types.ObjectId): Promise<ICreativeBrief | null> {
  return CreativeBrief.findOne({ contentItemId });
}

/**
 * Public entrypoint for GET /api/content-studio/briefs/:contentItemId.
 *
 * Mirrors assetService.listAssetsForContentItem's shape exactly: the route
 * takes only a contentItemId (no plan/org id), the ContentItem is resolved
 * to confirm it's real, `userId` is verified to belong to the item's
 * organization, and a missing brief is returned as `null` rather than
 * thrown - there is nothing wrong with a content item that simply hasn't
 * had a brief generated yet, the same way an item with zero generated
 * assets isn't an error either.
 *
 * contentItemId has a unique index on CreativeBrief (see the model), so
 * there is always at most one brief per item - no version-selection logic
 * is needed here.
 */
export async function getCreativeBriefForRequest(userId: string, contentItemId: string): Promise<ICreativeBrief | null> {
  if (!contentItemId || !Types.ObjectId.isValid(contentItemId)) {
    throw new InvalidContentStudioInputError("contentItemId is missing or invalid");
  }

  const item = await ContentItem.findById(contentItemId);
  if (!item) {
    throw new ContentItemNotFoundError(contentItemId);
  }

  await assertOrganizationMembership(userId, item.organizationId.toString());

  return getCreativeBriefForItem(item._id as Types.ObjectId);
}

/** Returns the existing brief for an item, generating one on the fly if none exists yet - used by the generation router so /graphics/generate and /videos/generate work even without a prior /briefs call. */
export async function ensureCreativeBrief(plan: IContentPlan, item: IContentItem): Promise<ICreativeBrief> {
  const existing = await getCreativeBriefForItem(item._id as Types.ObjectId);
  if (existing) return existing;
  return generateCreativeBrief(plan, item);
}

/** Public entrypoint for POST /api/content-studio/briefs - resolves the (contentPlanId, contentItemId) pair itself. */
export async function generateCreativeBriefForRequest(
  userId: string,
  contentPlanId: unknown,
  contentItemId: unknown
): Promise<ICreativeBrief> {
  const { plan, item } = await resolvePlanAndItem(userId, contentPlanId, contentItemId);
  return generateCreativeBrief(plan, item);
}
