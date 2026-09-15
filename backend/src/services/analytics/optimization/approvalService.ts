import { Types } from "mongoose";
import OptimizationRecommendation, { IOptimizationRecommendation } from "../../../models/OptimizationRecommendation";
import { AnalyticsDatabaseError, InvalidAnalyticsInputError, InvalidRecommendationStateError, RecommendationNotFoundError } from "../errors";

/**
 * Phase 11 - Step 12: Human Approval.
 *
 * This is the mandatory gate: only a recommendation in GENERATED/REVIEW
 * can be approved or rejected, and only an APPROVED recommendation can
 * ever reach executionService.ts. There is no path in this codebase from
 * "generated" to "executed" that skips this function.
 *
 * A generalized cross-feature Phase 9 approval/audit system does not
 * exist in this repo yet - this state machine lives directly on
 * OptimizationRecommendation for now. It is intentionally a thin,
 * self-contained gate so a future shared Phase 9 approval service could
 * front it later without changing the status semantics consumers rely on.
 */
const APPROVABLE_STATUSES = ["GENERATED", "REVIEW"];

function assertValidIds(organizationId: string, recommendationId: string): void {
  if (!organizationId || !Types.ObjectId.isValid(organizationId)) {
    throw new InvalidAnalyticsInputError("organizationId is missing or invalid");
  }
  if (!recommendationId || !Types.ObjectId.isValid(recommendationId)) {
    throw new InvalidAnalyticsInputError("recommendationId is missing or invalid");
  }
}

async function loadForTransition(organizationId: string, recommendationId: string): Promise<IOptimizationRecommendation> {
  let recommendation: IOptimizationRecommendation | null;
  try {
    recommendation = await OptimizationRecommendation.findOne({ _id: recommendationId, organizationId });
  } catch (error) {
    throw new AnalyticsDatabaseError(`failed to load recommendation: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (!recommendation) throw new RecommendationNotFoundError(recommendationId);
  return recommendation;
}

export async function approveRecommendation(
  organizationId: string,
  recommendationId: string,
  reviewedBy?: string
): Promise<IOptimizationRecommendation> {
  assertValidIds(organizationId, recommendationId);
  const recommendation = await loadForTransition(organizationId, recommendationId);

  if (!APPROVABLE_STATUSES.includes(recommendation.status)) {
    throw new InvalidRecommendationStateError(
      `cannot approve a recommendation in status "${recommendation.status}" - only GENERATED/REVIEW can be approved`
    );
  }

  recommendation.status = "APPROVED";
  recommendation.reviewedAt = new Date();
  if (reviewedBy && Types.ObjectId.isValid(reviewedBy)) {
    recommendation.reviewedBy = new Types.ObjectId(reviewedBy);
  }

  try {
    await recommendation.save();
  } catch (error) {
    throw new AnalyticsDatabaseError(`failed to approve recommendation: ${error instanceof Error ? error.message : String(error)}`);
  }
  return recommendation;
}

export async function rejectRecommendation(
  organizationId: string,
  recommendationId: string,
  reason?: string,
  reviewedBy?: string
): Promise<IOptimizationRecommendation> {
  assertValidIds(organizationId, recommendationId);
  const recommendation = await loadForTransition(organizationId, recommendationId);

  if (!APPROVABLE_STATUSES.includes(recommendation.status)) {
    throw new InvalidRecommendationStateError(
      `cannot reject a recommendation in status "${recommendation.status}" - only GENERATED/REVIEW can be rejected`
    );
  }

  recommendation.status = "REJECTED";
  recommendation.reviewedAt = new Date();
  recommendation.rejectionReason = reason;
  if (reviewedBy && Types.ObjectId.isValid(reviewedBy)) {
    recommendation.reviewedBy = new Types.ObjectId(reviewedBy);
  }

  try {
    await recommendation.save();
  } catch (error) {
    throw new AnalyticsDatabaseError(`failed to reject recommendation: ${error instanceof Error ? error.message : String(error)}`);
  }
  return recommendation;
}
