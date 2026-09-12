import mongoose, { Document, Schema, Types } from "mongoose";
import { ContentPlanDuration, ContentPlanStatus } from "../services/contentIntelligence/content.types";

const CONTENT_PLAN_DURATIONS: ContentPlanDuration[] = [
  "1_week",
  "2_weeks",
  "1_month",
  "3_months",
  "6_months",
  "custom",
];
const CONTENT_PLAN_STATUSES: ContentPlanStatus[] = ["draft", "active", "completed", "archived"];

/**
 * Phase 7 - Step 2: ContentPlan persistence model.
 *
 * strategyId is optional here even though the ContentPlan *type contract*
 * (content.types.ts) models it as required: this branch has no Strategy
 * Agent / MarketingStrategy collection to reference yet (see
 * services/contentIntelligence/adapters/strategyContextAdapter.ts).
 * Requiring it at the schema level would block every plan on a dependency
 * that doesn't exist. A caller that supplies a real strategyId gets it
 * validated as an ObjectId; a caller that doesn't is never given a
 * fabricated one.
 */
export interface IContentPlan extends Document {
  organizationId: Types.ObjectId;
  strategyId?: Types.ObjectId;
  campaignId?: Types.ObjectId;
  duration: ContentPlanDuration;
  startDate: Date;
  endDate: Date;
  objectives: string[];
  status: ContentPlanStatus;
  metadata?: Record<string, unknown>;
  /** Increments on regeneration, mirroring CompanyIntelligence's own versioning. Diff/rationale tracking ("why did the plan change") is a later Optimization Agent feature, not built here. */
  version: number;
}

const contentPlanSchema = new Schema<IContentPlan>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    strategyId: { type: Schema.Types.ObjectId, ref: "MarketingStrategy" },
    campaignId: { type: Schema.Types.ObjectId, ref: "Campaign" },

    duration: { type: String, enum: CONTENT_PLAN_DURATIONS, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },

    objectives: { type: [String], default: [] },

    status: {
      type: String,
      enum: CONTENT_PLAN_STATUSES,
      default: "draft",
      required: true,
      index: true,
    },

    metadata: { type: Schema.Types.Mixed, default: {} },

    version: { type: Number, default: 1, required: true },
  },
  {
    timestamps: true,
  }
);

contentPlanSchema.index({ organizationId: 1, status: 1 });

const ContentPlan = mongoose.model<IContentPlan>("ContentPlan", contentPlanSchema);

export default ContentPlan;
