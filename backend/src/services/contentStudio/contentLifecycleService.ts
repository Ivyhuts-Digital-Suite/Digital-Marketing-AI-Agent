import { Types } from "mongoose";
import CreativeAsset from "../../models/CreativeAsset";
import ContentLifecycleHistory, {
  ContentLifecycleActorType,
  ContentLifecycleStatusField,
  IContentLifecycleHistory,
} from "../../models/ContentLifecycleHistory";
import ContentItem, { IContentItem } from "../../models/ContentItem";
import ContentQualityCheck from "../../models/ContentQualityCheck";
import { ContentApprovalStatus, ContentPublishingStatus } from "../contentIntelligence/content.types";
import { resolveItemById } from "./contentResolver.service";
import {
  ContentStudioDatabaseError,
  GenerationNotCompleteError,
  InvalidContentStudioInputError,
  InvalidLifecycleTransitionError,
  PublishingProviderError,
  QualityGateNotPassedError,
  RequestChangesRequiresCommentError,
  SchedulingValidationError,
} from "./errors";
import { getPublishingProvider } from "./publishing/publishingProviderFactory";

/**
 * Phase 9 - Step 3: Central Lifecycle Service.
 *
 * The ONLY code in this codebase allowed to write ContentItem.approvalStatus
 * or ContentItem.publishingStatus, and the only writer of
 * ContentLifecycleHistory. No controller, no other service, mutates these
 * fields directly - every transition, valid or attempted-and-rejected,
 * goes through the functions in this file. (generationStatus is a
 * separate, pre-existing axis still owned by creativeBriefService.ts/
 * graphicGenerationService.ts/videoGenerationService.ts - this service
 * only READS it, e.g. to gate scheduling on "generated".)
 */

export interface LifecycleActor {
  type: ContentLifecycleActorType;
  /** User._id, required and meaningful only for actorType "USER". */
  id?: string;
  /** Human-readable label for AI/SYSTEM actors, e.g. "quality-check-service", "mock-publishing-provider". */
  label?: string;
}

const APPROVAL_TRANSITIONS: Record<ContentApprovalStatus, ContentApprovalStatus[]> = {
  draft: ["review"],
  review: ["approved", "changes_requested"],
  changes_requested: ["draft"],
  approved: [],
};

const PUBLISHING_TRANSITIONS: Record<ContentPublishingStatus, ContentPublishingStatus[]> = {
  unscheduled: ["scheduled", "archived"],
  scheduled: ["published", "archived", "failed"],
  published: ["archived"],
  failed: ["scheduled"],
  archived: [],
};

function assertValidOrganizationId(organizationId: string): void {
  if (!organizationId || !Types.ObjectId.isValid(organizationId)) {
    throw new InvalidContentStudioInputError("organizationId is missing or invalid");
  }
}

async function recordHistory(
  item: IContentItem,
  statusField: ContentLifecycleStatusField,
  fromStatus: string,
  toStatus: string,
  actor: LifecycleActor,
  comment?: string
): Promise<IContentLifecycleHistory> {
  try {
    return await ContentLifecycleHistory.create({
      organizationId: item.organizationId,
      contentItemId: item._id,
      statusField,
      fromStatus,
      toStatus,
      actorType: actor.type,
      actorId: actor.type === "USER" && actor.id && Types.ObjectId.isValid(actor.id) ? new Types.ObjectId(actor.id) : undefined,
      actorLabel: actor.label,
      comment,
      timestamp: new Date(),
    });
  } catch (error) {
    throw new ContentStudioDatabaseError(
      `failed to record lifecycle history: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

async function transitionApproval(
  item: IContentItem,
  to: ContentApprovalStatus,
  actor: LifecycleActor,
  comment?: string
): Promise<IContentItem> {
  const from = item.approvalStatus;
  const allowed = APPROVAL_TRANSITIONS[from] ?? [];
  if (!allowed.includes(to)) {
    throw new InvalidLifecycleTransitionError("approvalStatus", from, to);
  }

  item.approvalStatus = to;
  if (to === "approved" || to === "changes_requested") {
    if (actor.type === "USER" && actor.id && Types.ObjectId.isValid(actor.id)) {
      item.reviewerId = new Types.ObjectId(actor.id);
    }
    item.reviewedAt = new Date();
    item.reviewComment = comment;
  }

  try {
    await item.save();
  } catch (error) {
    throw new ContentStudioDatabaseError(`failed to update approval status: ${error instanceof Error ? error.message : String(error)}`);
  }

  await recordHistory(item, "approvalStatus", from, to, actor, comment);
  return item;
}

async function transitionPublishing(
  item: IContentItem,
  to: ContentPublishingStatus,
  actor: LifecycleActor,
  comment?: string
): Promise<IContentItem> {
  const from = item.publishingStatus;
  const allowed = PUBLISHING_TRANSITIONS[from] ?? [];
  if (!allowed.includes(to)) {
    throw new InvalidLifecycleTransitionError("publishingStatus", from, to);
  }

  item.publishingStatus = to;

  try {
    await item.save();
  } catch (error) {
    throw new ContentStudioDatabaseError(`failed to update publishing status: ${error instanceof Error ? error.message : String(error)}`);
  }

  await recordHistory(item, "publishingStatus", from, to, actor, comment);
  return item;
}

/**
 * Called ONLY by qualityCheckService.ts on a passing quality gate. This is
 * the sole path by which an "AI" actor may ever move content to REVIEW -
 * it can never reach APPROVED, by construction (APPROVED is not in
 * APPROVAL_TRANSITIONS.review's... it IS in review's allowed set, but this
 * function only ever requests "review" as the target, never "approved").
 */
export async function promoteToReviewOnQualityPass(organizationId: string, contentItemId: string): Promise<IContentItem> {
  assertValidOrganizationId(organizationId);
  const item = await ContentItem.findOne({ _id: contentItemId, organizationId });
  if (!item) throw new InvalidContentStudioInputError(`content item "${contentItemId}" was not found`);

  if (item.approvalStatus !== "draft") {
    // Already past draft (e.g. a second quality check re-run after review) - not an error, just a no-op.
    return item;
  }

  return transitionApproval(item, "review", { type: "AI", label: "quality-check-service" });
}

/**
 * Phase 9 - Step 5: "Submit for Review" (manual human trigger).
 * Requires generation to be complete AND the latest quality check to have
 * passed - submitting ungenerated or unchecked content for review would
 * make REVIEW meaningless. AI quality-passing is a precondition here, never
 * a replacement for the human action itself.
 */
export async function submitForReview(userId: string, contentItemId: unknown, actor: LifecycleActor): Promise<IContentItem> {
  const item = await resolveItemById(userId, contentItemId);

  if (item.generationStatus !== "generated") {
    throw new GenerationNotCompleteError(item._id.toString(), item.generationStatus);
  }

  const latestCheck = await ContentQualityCheck.findOne({ contentItemId: item._id }).sort({ checkedAt: -1 });
  if (!latestCheck) {
    throw new QualityGateNotPassedError(item._id.toString(), "no quality check has been run yet - run one first");
  }
  if (latestCheck.status !== "PASS") {
    throw new QualityGateNotPassedError(item._id.toString(), `the latest quality check did not pass (score ${latestCheck.score})`);
  }

  return transitionApproval(item, "review", actor);
}

/** Phase 9 - Step 5: "Approve" - human only. */
export async function approveContent(userId: string, contentItemId: unknown, reviewerId: string, comment?: string): Promise<IContentItem> {
  const item = await resolveItemById(userId, contentItemId);
  return transitionApproval(item, "approved", { type: "USER", id: reviewerId }, comment);
}

/** Phase 9 - Step 5: "Request Changes" - human only, comment is mandatory. */
export async function requestChanges(userId: string, contentItemId: unknown, reviewerId: string, comment: string | undefined): Promise<IContentItem> {
  if (!comment || comment.trim().length === 0) {
    throw new RequestChangesRequiresCommentError();
  }
  const item = await resolveItemById(userId, contentItemId);
  return transitionApproval(item, "changes_requested", { type: "USER", id: reviewerId }, comment.trim());
}

/**
 * Internal side effect (not a public endpoint): when a user explicitly
 * triggers regeneration (calls /briefs, /graphics/generate, or
 * /videos/generate again) on an item stuck in CHANGES_REQUESTED, that
 * explicit action is what authorizes moving it back to DRAFT - never
 * automatic on its own. See creativeBriefService.ts/
 * graphicGenerationService.ts/videoGenerationService.ts call sites.
 */
export async function resetToDraftForRegeneration(item: IContentItem): Promise<IContentItem> {
  if (item.approvalStatus !== "changes_requested") {
    return item;
  }
  return transitionApproval(item, "draft", { type: "USER", label: "regeneration requested" });
}

/**
 * Phase 9 - Step 5/6: "Archive" - human only. Per the spec's explicit
 * transition table, only APPROVED/SCHEDULED/PUBLISHED content can be
 * archived (draft/review/changes_requested content isn't a finished
 * artifact yet - there is nothing to "retire").
 */
export async function archiveContent(userId: string, contentItemId: unknown, reviewerId: string, comment?: string): Promise<IContentItem> {
  const item = await resolveItemById(userId, contentItemId);

  if (item.approvalStatus !== "approved") {
    throw new InvalidLifecycleTransitionError("publishingStatus", item.publishingStatus, "archived");
  }

  item.reviewerId = Types.ObjectId.isValid(reviewerId) ? new Types.ObjectId(reviewerId) : item.reviewerId;
  item.reviewedAt = new Date();
  if (comment) item.reviewComment = comment;

  return transitionPublishing(item, "archived", { type: "USER", id: reviewerId }, comment);
}

export interface ScheduleContentInput {
  scheduledAt: Date;
  scheduledTimezone: string;
}

function isValidIanaTimezone(timezone: string): boolean {
  try {
    // Throws RangeError for an unrecognized timezone name - the standard
    // way to validate an IANA zone without a third-party dependency.
    new Intl.DateTimeFormat("en-US", { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

/**
 * Phase 9 - Step 8/11: "Schedule" - requires APPROVED, a future
 * scheduledAt, a valid IANA timezone (never silently defaulted to UTC),
 * and completed generation (required assets exist - see
 * GenerationNotCompleteError's use elsewhere; here it's a
 * SchedulingValidationError since scheduling is the action being
 * rejected, not review).
 */
export async function scheduleContent(userId: string, contentItemId: unknown, input: ScheduleContentInput, actorId: string): Promise<IContentItem> {
  const item = await resolveItemById(userId, contentItemId);

  if (item.approvalStatus !== "approved") {
    throw new SchedulingValidationError(`content must be APPROVED first (currently "${item.approvalStatus}")`);
  }
  if (item.generationStatus !== "generated") {
    throw new SchedulingValidationError("required generated assets do not exist yet for this content item");
  }
  if (!input.scheduledTimezone || !isValidIanaTimezone(input.scheduledTimezone)) {
    throw new SchedulingValidationError(`"${input.scheduledTimezone}" is not a valid IANA timezone name`);
  }
  if (!(input.scheduledAt instanceof Date) || Number.isNaN(input.scheduledAt.getTime())) {
    throw new SchedulingValidationError("scheduledAt is missing or invalid");
  }
  if (input.scheduledAt.getTime() <= Date.now()) {
    throw new SchedulingValidationError("scheduledAt must be in the future");
  }

  item.scheduledAt = input.scheduledAt;
  item.scheduledTimezone = input.scheduledTimezone;

  return transitionPublishing(item, "scheduled", { type: "USER", id: actorId });
}

/**
 * Phase 9 - Step 9/12: "Publish" via PublishingProvider. Not exposed as a
 * public API endpoint in Phase 9 (no scheduler/cron exists in this
 * codebase to call it automatically, and the spec scopes this phase to
 * "the scheduling system, not the Instagram API integration") - exists so
 * the abstraction is real, callable, and testable, ready for a future
 * scheduler or the real Instagram integration to invoke.
 */
export async function publishContent(organizationId: string, contentItemId: string, actor: LifecycleActor): Promise<IContentItem> {
  assertValidOrganizationId(organizationId);
  const item = await ContentItem.findOne({ _id: contentItemId, organizationId });
  if (!item) throw new InvalidContentStudioInputError(`content item "${contentItemId}" was not found`);

  if (item.publishingStatus !== "scheduled") {
    throw new InvalidLifecycleTransitionError("publishingStatus", item.publishingStatus, "published");
  }

  const assets = await CreativeAsset.find({ contentItemId: item._id, status: { $ne: "failed" } });
  const provider = getPublishingProvider();

  const caption = [item.hook, item.message, item.cta].filter(Boolean).join("\n\n");
  const result = await provider.publish({
    organizationId,
    contentItemId: item._id.toString(),
    platform: item.platform,
    caption,
    assetUrls: assets.map((a) => a.url).filter((url): url is string => Boolean(url)),
  });

  if (!result.success) {
    await transitionPublishing(item, "failed", actor, result.message);
    throw new PublishingProviderError(provider.name, result.message);
  }

  item.publishedAt = result.publishedAt ?? new Date();
  item.externalPostId = result.externalPostId;
  item.publishingProvider = provider.name;

  return transitionPublishing(item, "published", actor, result.isMock ? `MOCK publish (${provider.name}) - not a real Instagram post.` : undefined);
}

export async function getContentHistory(userId: string, contentItemId: unknown): Promise<IContentLifecycleHistory[]> {
  const item = await resolveItemById(userId, contentItemId);
  try {
    return await ContentLifecycleHistory.find({ contentItemId: item._id }).sort({ timestamp: 1 });
  } catch (error) {
    throw new ContentStudioDatabaseError(`failed to load lifecycle history: ${error instanceof Error ? error.message : String(error)}`);
  }
}
