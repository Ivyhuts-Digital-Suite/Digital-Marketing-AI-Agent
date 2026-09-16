import { Types } from "mongoose";
import ContentItem, { IContentItem } from "../../models/ContentItem";
import ContentPlan, { IContentPlan } from "../../models/ContentPlan";
import { assertOrganizationMembership } from "../../middleware/organization.middleware";
import { ContentItemNotFoundError, InvalidContentStudioInputError } from "./errors";
import { ContentPlanNotFoundError } from "../contentIntelligence/errors";

export interface ResolvedPlanAndItem {
  plan: IContentPlan;
  item: IContentItem;
}

/**
 * Resolves and cross-validates a (contentPlanId, contentItemId) pair - the
 * only two ids every Content Studio endpoint takes from the caller - and
 * verifies `userId` actually belongs to the resolved plan's organization
 * (see middleware/organization.middleware.ts) before returning anything.
 * organizationId is never accepted from the request itself: it's derived
 * from the plan, and the item is only considered found when it belongs to
 * BOTH that exact plan and that plan's organization.
 */
export async function resolvePlanAndItem(
  userId: string,
  contentPlanId: unknown,
  contentItemId: unknown
): Promise<ResolvedPlanAndItem> {
  if (typeof contentPlanId !== "string" || !Types.ObjectId.isValid(contentPlanId)) {
    throw new InvalidContentStudioInputError("contentPlanId is missing or invalid");
  }
  if (typeof contentItemId !== "string" || !Types.ObjectId.isValid(contentItemId)) {
    throw new InvalidContentStudioInputError("contentItemId is missing or invalid");
  }

  const plan = await ContentPlan.findById(contentPlanId);
  if (!plan) {
    throw new ContentPlanNotFoundError(contentPlanId);
  }

  await assertOrganizationMembership(userId, plan.organizationId.toString());

  const item = await ContentItem.findOne({
    _id: contentItemId,
    contentPlanId: plan._id,
    organizationId: plan.organizationId,
  });
  if (!item) {
    throw new ContentItemNotFoundError(contentItemId);
  }

  return { plan, item };
}

/**
 * Phase 9: resolves a single ContentItem by id and verifies `userId`
 * belongs to its organization - the pattern every lifecycle endpoint
 * (submit-review/approve/request-changes/archive/schedule/history/
 * quality-check) uses, since they only ever receive :contentItemId, not a
 * plan id. Mirrors creativeBriefService.ts::getCreativeBriefForRequest's
 * existing single-id resolution style exactly.
 */
export async function resolveItemById(userId: string, contentItemId: unknown): Promise<IContentItem> {
  if (typeof contentItemId !== "string" || !Types.ObjectId.isValid(contentItemId)) {
    throw new InvalidContentStudioInputError("contentItemId is missing or invalid");
  }

  const item = await ContentItem.findById(contentItemId);
  if (!item) {
    throw new ContentItemNotFoundError(contentItemId);
  }

  await assertOrganizationMembership(userId, item.organizationId.toString());

  return item;
}
