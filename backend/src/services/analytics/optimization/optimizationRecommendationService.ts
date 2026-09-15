import { Types } from "mongoose";
import AnalyticsFinding, { IAnalyticsFinding } from "../../../models/AnalyticsFinding";
import OptimizationRecommendation, { IOptimizationRecommendation } from "../../../models/OptimizationRecommendation";
import { AnalyticsDatabaseError, FindingNotFoundError, InvalidAnalyticsInputError } from "../errors";
import { requestOptimizationAnalysis } from "./optimizationAgentLlm";

/**
 * Phase 11 - Step 11: Optimization Recommendation generation.
 *
 * Loads a real, already-persisted AnalyticsFinding, asks the Optimization
 * Agent to diagnose it, and validates every hypothesis's evidenceRefs
 * actually index into that finding's own evidence[] array before
 * persisting anything. A hypothesis whose refs are all out of range is
 * dropped rather than persisted ungrounded; if every hypothesis is dropped
 * this way, the whole recommendation is rejected rather than saved with no
 * real hypotheses.
 */
function assertValidOrganizationId(organizationId: string): void {
  if (!organizationId || !Types.ObjectId.isValid(organizationId)) {
    throw new InvalidAnalyticsInputError("organizationId is missing or invalid");
  }
}

async function loadFinding(organizationId: string, findingId: string): Promise<IAnalyticsFinding> {
  if (!Types.ObjectId.isValid(findingId)) {
    throw new InvalidAnalyticsInputError("findingId is missing or invalid");
  }

  let finding: IAnalyticsFinding | null;
  try {
    finding = await AnalyticsFinding.findOne({ _id: findingId, organizationId });
  } catch (error) {
    throw new AnalyticsDatabaseError(`failed to load finding: ${error instanceof Error ? error.message : String(error)}`);
  }

  if (!finding) throw new FindingNotFoundError(findingId);
  return finding;
}

export async function generateRecommendation(organizationId: string, findingId: string): Promise<IOptimizationRecommendation> {
  assertValidOrganizationId(organizationId);
  const finding = await loadFinding(organizationId, findingId);

  const analysis = await requestOptimizationAnalysis(finding);
  const evidenceCount = finding.evidence.length;

  const groundedHypotheses = analysis.hypotheses
    .map((h) => ({ hypothesis: h.hypothesis, evidenceRefs: h.evidenceRefs.filter((ref) => ref >= 0 && ref < evidenceCount) }))
    .filter((h) => h.evidenceRefs.length > 0);

  if (groundedHypotheses.length === 0) {
    throw new InvalidAnalyticsInputError(
      "the optimization agent's hypotheses cited no valid evidence from the triggering finding - refusing to persist an ungrounded recommendation"
    );
  }

  try {
    return await OptimizationRecommendation.create({
      organizationId,
      triggerFindingId: finding._id,
      diagnosis: analysis.diagnosis,
      hypotheses: groundedHypotheses,
      recommendedAction: analysis.recommendedAction,
      expectedImpact: analysis.expectedImpact,
      confidence: analysis.confidence,
      affectedEntities: [finding.affectedEntity],
      requiredTools: analysis.requiredTools,
      riskLevel: analysis.riskLevel,
      status: "REVIEW",
    });
  } catch (error) {
    throw new AnalyticsDatabaseError(`failed to persist recommendation: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function listRecommendations(organizationId: string): Promise<IOptimizationRecommendation[]> {
  assertValidOrganizationId(organizationId);
  try {
    return await OptimizationRecommendation.find({ organizationId }).sort({ createdAt: -1 });
  } catch (error) {
    throw new AnalyticsDatabaseError(`failed to list recommendations: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function getRecommendation(organizationId: string, recommendationId: string): Promise<IOptimizationRecommendation | null> {
  assertValidOrganizationId(organizationId);
  if (!Types.ObjectId.isValid(recommendationId)) {
    throw new InvalidAnalyticsInputError("recommendationId is missing or invalid");
  }
  try {
    return await OptimizationRecommendation.findOne({ _id: recommendationId, organizationId });
  } catch (error) {
    throw new AnalyticsDatabaseError(`failed to load recommendation: ${error instanceof Error ? error.message : String(error)}`);
  }
}
