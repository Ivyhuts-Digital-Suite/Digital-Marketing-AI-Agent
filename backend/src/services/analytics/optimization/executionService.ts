import { Types } from "mongoose";
import OptimizationExecution, { IOptimizationExecution } from "../../../models/OptimizationExecution";
import OptimizationRecommendation, { IOptimizationRecommendation } from "../../../models/OptimizationRecommendation";
import { marketingIntegrationProvider } from "../adapters/marketingIntegrationAdapter";
import { AnalyticsDatabaseError, InvalidAnalyticsInputError, InvalidRecommendationStateError, RecommendationNotFoundError } from "../errors";

/**
 * Phase 11 - Step 13: Phase 10 Execution Integration.
 *
 * ONLY an APPROVED recommendation can reach this function (rule #11: never
 * let Optimization execute on its own). Execution is always attempted
 * through marketingIntegrationProvider - never a direct Meta/Google/CRM
 * call from here. When Phase 10 doesn't have the tool (always true right
 * now, since Phase 10 doesn't exist in this codebase), the recommendation
 * stays APPROVED and a "requires_phase10_integration" OptimizationExecution
 * row is persisted - never a fabricated "executed" result.
 */
function assertValidIds(organizationId: string, recommendationId: string): void {
  if (!organizationId || !Types.ObjectId.isValid(organizationId)) {
    throw new InvalidAnalyticsInputError("organizationId is missing or invalid");
  }
  if (!recommendationId || !Types.ObjectId.isValid(recommendationId)) {
    throw new InvalidAnalyticsInputError("recommendationId is missing or invalid");
  }
}

export async function executeRecommendation(
  organizationId: string,
  recommendationId: string
): Promise<{ recommendation: IOptimizationRecommendation; execution: IOptimizationExecution }> {
  assertValidIds(organizationId, recommendationId);

  let recommendation: IOptimizationRecommendation | null;
  try {
    recommendation = await OptimizationRecommendation.findOne({ _id: recommendationId, organizationId });
  } catch (error) {
    throw new AnalyticsDatabaseError(`failed to load recommendation: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (!recommendation) throw new RecommendationNotFoundError(recommendationId);

  if (recommendation.status !== "APPROVED") {
    throw new InvalidRecommendationStateError(
      `cannot execute a recommendation in status "${recommendation.status}" - it must be APPROVED first`
    );
  }

  recommendation.status = "EXECUTING";
  await recommendation.save();

  const requiredTool = recommendation.requiredTools[0] ?? "unspecified_tool";
  const attemptedAt = new Date();

  const result = await marketingIntegrationProvider.executeTool(requiredTool, {
    organizationId,
    recommendationId,
    recommendedAction: recommendation.recommendedAction,
    affectedEntities: recommendation.affectedEntities,
  });

  let execution: IOptimizationExecution;
  try {
    execution = await OptimizationExecution.create({
      organizationId,
      recommendationId: recommendation._id,
      requiredTool,
      attemptedAt,
      result: result.available ? "executed" : "requires_phase10_integration",
      resultMessage: result.message,
      measurement: [],
    });
  } catch (error) {
    throw new AnalyticsDatabaseError(`failed to persist execution record: ${error instanceof Error ? error.message : String(error)}`);
  }

  // Never advance to EXECUTED/COMPLETED without a real successful execution result.
  recommendation.status = result.available ? "EXECUTED" : "APPROVED";
  await recommendation.save();

  return { recommendation, execution };
}
