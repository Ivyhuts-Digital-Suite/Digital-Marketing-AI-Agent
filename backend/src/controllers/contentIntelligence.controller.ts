import { Request, Response } from "express";
import { ContentGoal, ContentPlanDuration } from "../services/contentIntelligence/content.types";
import { contentIntelligenceService } from "../services/contentIntelligence/contentIntelligenceService";
import {
  ContentIntelligenceConfigurationError,
  ContentIntelligenceDatabaseError,
  ContentIntelligenceLlmRequestError,
  ContentPlanNotFoundError,
  InvalidContentIntelligenceInputError,
  InvalidContentIntelligenceLlmResponseError,
  NoCompanyKnowledgeForContentError,
  NoViableTopicsError,
} from "../services/contentIntelligence/errors";

const CONTENT_GOALS: ContentGoal[] = [
  "generate_leads",
  "increase_awareness",
  "launch_product",
  "increase_engagement",
  "build_authority",
  "drive_website_traffic",
];

const CONTENT_PLAN_DURATIONS: ContentPlanDuration[] = ["1_week", "2_weeks", "1_month", "3_months", "6_months", "custom"];

function handleError(error: unknown, res: Response): void {
  if (error instanceof InvalidContentIntelligenceInputError) {
    res.status(400).json({ message: error.message });
    return;
  }

  if (error instanceof NoCompanyKnowledgeForContentError || error instanceof NoViableTopicsError) {
    res.status(404).json({ message: error.message });
    return;
  }

  if (error instanceof ContentPlanNotFoundError) {
    res.status(404).json({ message: error.message });
    return;
  }

  if (error instanceof ContentIntelligenceConfigurationError) {
    console.error("Content Intelligence Configuration Error:", error.message);
    res.status(503).json({ message: "Content intelligence generation is not available right now" });
    return;
  }

  if (error instanceof ContentIntelligenceLlmRequestError || error instanceof InvalidContentIntelligenceLlmResponseError) {
    console.error("Content Intelligence LLM Error:", error.message);
    res.status(502).json({ message: "Content intelligence generation failed upstream, please try again" });
    return;
  }

  if (error instanceof ContentIntelligenceDatabaseError) {
    console.error("Content Intelligence Database Error:", error.message);
    res.status(500).json({ message: "Server error" });
    return;
  }

  console.error("Content Intelligence Unexpected Error:", error);
  res.status(500).json({ message: "Server error" });
}

/**
 * POST /api/content-intelligence/plans
 *
 * Note: same caveat as companyIntelligence.controller.ts - this codebase
 * does not yet model which organization(s) a user belongs to, so this
 * endpoint can only verify that the caller is authenticated, not that they
 * belong to the given organizationId. Add that membership check here once
 * organization membership exists.
 */
export const generateContentPlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { organizationId, goal, duration, strategyId, campaignId, startDate, endDate, itemsPerWeek } = req.body;

    if (!organizationId || typeof organizationId !== "string") {
      res.status(400).json({ message: "organizationId is required" });
      return;
    }
    if (!goal || !CONTENT_GOALS.includes(goal)) {
      res.status(400).json({ message: `goal is required and must be one of: ${CONTENT_GOALS.join(", ")}` });
      return;
    }
    if (!duration || !CONTENT_PLAN_DURATIONS.includes(duration)) {
      res.status(400).json({ message: `duration is required and must be one of: ${CONTENT_PLAN_DURATIONS.join(", ")}` });
      return;
    }

    const result = await contentIntelligenceService.generatePlan({
      organizationId,
      goal,
      duration,
      strategyId: typeof strategyId === "string" ? strategyId : undefined,
      campaignId: typeof campaignId === "string" ? campaignId : undefined,
      startDate: typeof startDate === "string" ? new Date(startDate) : undefined,
      endDate: typeof endDate === "string" ? new Date(endDate) : undefined,
      itemsPerWeek: typeof itemsPerWeek === "number" ? itemsPerWeek : undefined,
    });

    res.status(201).json({ message: "Content plan generated successfully", result });
  } catch (error) {
    handleError(error, res);
  }
};

/** GET /api/content-intelligence/plans/:organizationId */
export const listContentPlans = async (req: Request, res: Response): Promise<void> => {
  try {
    const { organizationId } = req.params;
    if (typeof organizationId !== "string") {
      res.status(400).json({ message: "organizationId is required" });
      return;
    }
    const plans = await contentIntelligenceService.listPlans(organizationId);
    res.status(200).json({ plans });
  } catch (error) {
    handleError(error, res);
  }
};

/** GET /api/content-intelligence/plans/:organizationId/:planId */
export const getContentPlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { organizationId, planId } = req.params;
    if (typeof organizationId !== "string" || typeof planId !== "string") {
      res.status(400).json({ message: "organizationId and planId are required" });
      return;
    }
    const result = await contentIntelligenceService.getPlanWithItems(organizationId, planId);
    res.status(200).json(result);
  } catch (error) {
    handleError(error, res);
  }
};

/** GET /api/content-intelligence/gaps/:organizationId */
export const getContentGaps = async (req: Request, res: Response): Promise<void> => {
  try {
    const { organizationId } = req.params;
    if (typeof organizationId !== "string") {
      res.status(400).json({ message: "organizationId is required" });
      return;
    }
    const gaps = await contentIntelligenceService.analyzeGaps(organizationId);
    res.status(200).json({ gaps });
  } catch (error) {
    handleError(error, res);
  }
};
