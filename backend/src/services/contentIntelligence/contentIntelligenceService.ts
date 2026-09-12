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
}

export const contentIntelligenceService = new ContentIntelligenceService();
