import { Types } from "mongoose";
import ContentItem, { IContentItem } from "../../models/ContentItem";
import ContentPlan, { IContentPlan } from "../../models/ContentPlan";
import { gatherContentIntelligenceContext } from "./contentContextService";
import { analyzeContentGaps } from "./contentGapAnalyzer";
import { generateContentPlan } from "./contentPlanGenerator";
import {
  ContentIntelligenceDatabaseError,
  ContentPlanNotFoundError,
  InvalidContentIntelligenceInputError,
  InvalidContentPlanStatusTransitionError,
} from "./errors";
import { ContentGapAnalysis, GenerateContentPlanInput, GenerateContentPlanResult } from "./types";

export interface ContentPlanWithItems {
  plan: IContentPlan;
  items: IContentItem[];
}

/**
 * Step 10: Main Content Intelligence Orchestrator.
 *
 * The public facade for the whole Phase 7 pipeline (Steps 3-9), plus read
 * APIs over persisted plans. Every method validates its own inputs at the
 * boundary, mirroring CompanyIntelligenceService's role in Phase 3.
 */
export class ContentIntelligenceService {
  async generatePlan(input: GenerateContentPlanInput): Promise<GenerateContentPlanResult> {
    return generateContentPlan(input);
  }

  async analyzeGaps(organizationId: string): Promise<ContentGapAnalysis> {
    if (!organizationId || !Types.ObjectId.isValid(organizationId)) {
      throw new InvalidContentIntelligenceInputError("organizationId is missing or invalid");
    }
    const context = await gatherContentIntelligenceContext(organizationId);
    return analyzeContentGaps(context);
  }

  async listPlans(organizationId: string): Promise<IContentPlan[]> {
    if (!organizationId || !Types.ObjectId.isValid(organizationId)) {
      throw new InvalidContentIntelligenceInputError("organizationId is missing or invalid");
    }
    try {
      return await ContentPlan.find({ organizationId }).sort({ createdAt: -1 });
    } catch (error) {
      throw new ContentIntelligenceDatabaseError(
        `failed to list content plans: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async getPlanWithItems(organizationId: string, planId: string): Promise<ContentPlanWithItems> {
    if (!organizationId || !Types.ObjectId.isValid(organizationId)) {
      throw new InvalidContentIntelligenceInputError("organizationId is missing or invalid");
    }
    if (!planId || !Types.ObjectId.isValid(planId)) {
      throw new InvalidContentIntelligenceInputError("planId is missing or invalid");
    }

    let plan: IContentPlan | null;
    let items: IContentItem[];
    try {
      [plan, items] = await Promise.all([
        ContentPlan.findOne({ _id: planId, organizationId }),
        ContentItem.find({ contentPlanId: planId, organizationId }).sort({ scheduledDate: 1 }),
      ]);
    } catch (error) {
      throw new ContentIntelligenceDatabaseError(
        `failed to load content plan: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    if (!plan) {
      throw new ContentPlanNotFoundError(planId);
    }

    return { plan, items };
  }

  /**
   * Locks a draft plan so it becomes the source of truth for content
   * generation. Only "draft" -> "finalized" is allowed here: a plan that's
   * already finalized/in_progress/completed/archived is left untouched
   * rather than silently re-finalized, so callers can't accidentally
   * re-trigger the transition (and its downstream effects) twice.
   */
  async finalizePlan(organizationId: string, planId: string): Promise<IContentPlan> {
    if (!organizationId || !Types.ObjectId.isValid(organizationId)) {
      throw new InvalidContentIntelligenceInputError("organizationId is missing or invalid");
    }
    if (!planId || !Types.ObjectId.isValid(planId)) {
      throw new InvalidContentIntelligenceInputError("planId is missing or invalid");
    }

    let plan: IContentPlan | null;
    try {
      plan = await ContentPlan.findOne({ _id: planId, organizationId });
    } catch (error) {
      throw new ContentIntelligenceDatabaseError(
        `failed to load content plan: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    if (!plan) {
      throw new ContentPlanNotFoundError(planId);
    }

    if (plan.status !== "draft") {
      throw new InvalidContentPlanStatusTransitionError(
        `plan "${planId}" is "${plan.status}" - only a "draft" plan can be finalized`
      );
    }

    try {
      plan.status = "finalized";
      await plan.save();
      return plan;
    } catch (error) {
      throw new ContentIntelligenceDatabaseError(
        `failed to finalize content plan: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}

export const contentIntelligenceService = new ContentIntelligenceService();
