import { IOptimizationExecution } from "../../models/OptimizationExecution";
import { IOptimizationRecommendation } from "../../models/OptimizationRecommendation";
import { approveRecommendation, rejectRecommendation } from "./optimization/approvalService";
import { executeRecommendation } from "./optimization/executionService";
import { getRecommendation, listRecommendations } from "./optimization/optimizationRecommendationService";

/**
 * Phase 11 - Step 18: top-level Optimization facade consumed by
 * optimization.controller.ts. Thin re-export layer so the controller has
 * one import surface, mirroring analyticsService.ts.
 */
export { listRecommendations, getRecommendation };

export async function approve(organizationId: string, recommendationId: string, reviewedBy?: string): Promise<IOptimizationRecommendation> {
  return approveRecommendation(organizationId, recommendationId, reviewedBy);
}

export async function reject(
  organizationId: string,
  recommendationId: string,
  reason?: string,
  reviewedBy?: string
): Promise<IOptimizationRecommendation> {
  return rejectRecommendation(organizationId, recommendationId, reason, reviewedBy);
}

export async function execute(
  organizationId: string,
  recommendationId: string
): Promise<{ recommendation: IOptimizationRecommendation; execution: IOptimizationExecution }> {
  return executeRecommendation(organizationId, recommendationId);
}
