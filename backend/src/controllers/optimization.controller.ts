import { Request, Response } from "express";
import * as optimizationService from "../services/analytics/optimizationService";
import {
  AnalyticsDatabaseError,
  InvalidAnalyticsInputError,
  InvalidRecommendationStateError,
  OptimizationAgentConfigurationError,
  OptimizationAgentLlmRequestError,
  InvalidOptimizationAgentLlmResponseError,
  RecommendationNotFoundError,
} from "../services/analytics/errors";

/**
 * Phase 11 - Step 18/19: Optimization API.
 *
 * Same documented security caveat as analytics.controller.ts: no
 * Organization membership model exists yet, so `authenticate` proves a
 * valid user, not org membership. Every recommendation lookup/mutation IS
 * scoped by organizationId.
 */
function handleError(error: unknown, res: Response): void {
  if (error instanceof InvalidAnalyticsInputError) {
    res.status(400).json({ message: error.message });
    return;
  }
  if (error instanceof RecommendationNotFoundError) {
    res.status(404).json({ message: error.message });
    return;
  }
  if (error instanceof InvalidRecommendationStateError) {
    res.status(409).json({ message: error.message });
    return;
  }
  if (error instanceof OptimizationAgentConfigurationError) {
    console.error("Optimization Agent Configuration Error:", error.message);
    res.status(503).json({ message: "Optimization recommendation generation is not available right now" });
    return;
  }
  if (error instanceof OptimizationAgentLlmRequestError || error instanceof InvalidOptimizationAgentLlmResponseError) {
    console.error("Optimization Agent LLM Error:", error.message);
    res.status(502).json({ message: "Optimization recommendation generation failed upstream, please try again" });
    return;
  }
  if (error instanceof AnalyticsDatabaseError) {
    console.error("Optimization Database Error:", error.message);
    res.status(500).json({ message: "Server error" });
    return;
  }
  console.error("Optimization Unexpected Error:", error);
  res.status(500).json({ message: "Server error" });
}

/** Express 5's req.params values type as `string | string[]`; a route param is always a single string in practice. */
function requireParam(value: string | string[] | undefined, name: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new InvalidAnalyticsInputError(`${name} is required`);
  }
  return value;
}

/** GET /api/optimization/recommendations/:orgId */
export const listRecommendations = async (req: Request, res: Response): Promise<void> => {
  try {
    const orgId = requireParam(req.params.orgId, "orgId");
    const recommendations = await optimizationService.listRecommendations(orgId);
    res.status(200).json({ recommendations });
  } catch (error) {
    handleError(error, res);
  }
};

/** GET /api/optimization/recommendations/:orgId/:recommendationId */
export const getRecommendation = async (req: Request, res: Response): Promise<void> => {
  try {
    const orgId = requireParam(req.params.orgId, "orgId");
    const recommendationId = requireParam(req.params.recommendationId, "recommendationId");
    const recommendation = await optimizationService.getRecommendation(orgId, recommendationId);
    if (!recommendation) {
      res.status(404).json({ message: `Optimization recommendation "${recommendationId}" was not found.` });
      return;
    }
    res.status(200).json({ recommendation });
  } catch (error) {
    handleError(error, res);
  }
};

/** POST /api/optimization/recommendations/:id/approve  (body: { organizationId }) */
export const approveRecommendation = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = requireParam(req.params.id, "id");
    const { organizationId } = req.body;
    if (!organizationId || typeof organizationId !== "string") {
      res.status(400).json({ message: "organizationId is required" });
      return;
    }
    const recommendation = await optimizationService.approve(organizationId, id, req.user?.id);
    res.status(200).json({ message: "Recommendation approved", recommendation });
  } catch (error) {
    handleError(error, res);
  }
};

/** POST /api/optimization/recommendations/:id/reject  (body: { organizationId, reason? }) */
export const rejectRecommendation = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = requireParam(req.params.id, "id");
    const { organizationId, reason } = req.body;
    if (!organizationId || typeof organizationId !== "string") {
      res.status(400).json({ message: "organizationId is required" });
      return;
    }
    const recommendation = await optimizationService.reject(organizationId, id, typeof reason === "string" ? reason : undefined, req.user?.id);
    res.status(200).json({ message: "Recommendation rejected", recommendation });
  } catch (error) {
    handleError(error, res);
  }
};

/** POST /api/optimization/recommendations/:id/execute  (body: { organizationId }) */
export const executeRecommendation = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = requireParam(req.params.id, "id");
    const { organizationId } = req.body;
    if (!organizationId || typeof organizationId !== "string") {
      res.status(400).json({ message: "organizationId is required" });
      return;
    }
    const result = await optimizationService.execute(organizationId, id);
    res.status(200).json({ message: "Execution attempted", ...result });
  } catch (error) {
    handleError(error, res);
  }
};
