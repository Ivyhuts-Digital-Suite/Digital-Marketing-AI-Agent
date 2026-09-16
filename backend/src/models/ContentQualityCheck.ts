import mongoose, { Document, Schema, Types } from "mongoose";

/**
 * Phase 9 - Step 4: ContentQualityCheck.
 *
 * Persisted output of the AI Content Quality Check - the structured
 * "quality report" the spec requires between generation and human review.
 * Every score/flag here traces to a real LLM call whose response was
 * Zod-validated before being written here (see
 * services/contentStudio/qualityCheckService.ts) - nothing on this model
 * is ever fabricated or defaulted to a passing value.
 *
 * One check category per dimension named in the spec: strategyAlignment
 * (calendar/audience/funnel-stage/goal/pillar alignment), messaging (hook/
 * core-message/CTA/consistency), brandSafety (voice/tone/allowed-forbidden-
 * unsupported claims), instagramFit (format/caption/visual-message
 * consistency/CTA suitability), and the two asset-specific dimensions
 * graphics/video, which are omitted (not scored 0) when no such asset
 * exists yet for this item - "not applicable" is never silently scored as
 * "passed".
 */
export type ContentQualityCheckStatus = "PASS" | "FAIL";

export interface IQualityCheckCategory {
  passed: boolean;
  score: number;
  notes: string[];
}

export interface IFlaggedClaim {
  claim: string;
  type: "forbidden" | "unsupported";
  reason: string;
}

export interface IQualityCheckUsage {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
}

export interface IContentQualityCheckChecks {
  strategyAlignment: IQualityCheckCategory;
  messaging: IQualityCheckCategory;
  brandSafety: IQualityCheckCategory;
  instagramFit: IQualityCheckCategory;
  graphics?: IQualityCheckCategory;
  video?: IQualityCheckCategory;
}

export interface IContentQualityCheck extends Document {
  organizationId: Types.ObjectId;
  contentPlanId: Types.ObjectId;
  contentItemId: Types.ObjectId;
  creativeBriefId: Types.ObjectId;
  assetIds: Types.ObjectId[];

  score: number;
  status: ContentQualityCheckStatus;
  checks: IContentQualityCheckChecks;
  flaggedClaims: IFlaggedClaim[];
  issues: string[];
  warnings: string[];
  recommendations: string[];

  checkedAt: Date;
  /** Named `aiModel` (not `model`) - `model` is reserved on Mongoose's own Document interface. */
  aiModel: string;
  aiModelVersion?: string;
  usage: IQualityCheckUsage;
}

const categorySchema = new Schema<IQualityCheckCategory>(
  { passed: { type: Boolean, required: true }, score: { type: Number, required: true, min: 0, max: 100 }, notes: { type: [String], default: [] } },
  { _id: false }
);

const flaggedClaimSchema = new Schema<IFlaggedClaim>(
  {
    claim: { type: String, required: true },
    type: { type: String, enum: ["forbidden", "unsupported"], required: true },
    reason: { type: String, required: true },
  },
  { _id: false }
);

const usageSchema = new Schema<IQualityCheckUsage>(
  { inputTokens: { type: Number }, outputTokens: { type: Number }, totalTokens: { type: Number } },
  { _id: false }
);

const checksSchema = new Schema<IContentQualityCheckChecks>(
  {
    strategyAlignment: { type: categorySchema, required: true },
    messaging: { type: categorySchema, required: true },
    brandSafety: { type: categorySchema, required: true },
    instagramFit: { type: categorySchema, required: true },
    graphics: { type: categorySchema },
    video: { type: categorySchema },
  },
  { _id: false }
);

const contentQualityCheckSchema = new Schema<IContentQualityCheck>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    contentPlanId: { type: Schema.Types.ObjectId, ref: "ContentPlan", required: true },
    contentItemId: { type: Schema.Types.ObjectId, ref: "ContentItem", required: true, index: true },
    creativeBriefId: { type: Schema.Types.ObjectId, ref: "CreativeBrief", required: true },
    assetIds: [{ type: Schema.Types.ObjectId, ref: "CreativeAsset" }],

    score: { type: Number, required: true, min: 0, max: 100 },
    status: { type: String, enum: ["PASS", "FAIL"], required: true },
    checks: { type: checksSchema, required: true },
    flaggedClaims: { type: [flaggedClaimSchema], default: [] },
    issues: { type: [String], default: [] },
    warnings: { type: [String], default: [] },
    recommendations: { type: [String], default: [] },

    checkedAt: { type: Date, required: true },
    aiModel: { type: String, required: true },
    aiModelVersion: { type: String },
    usage: { type: usageSchema, default: {} },
  },
  { timestamps: true }
);

contentQualityCheckSchema.index({ organizationId: 1, contentItemId: 1, checkedAt: -1 });

const ContentQualityCheck = mongoose.model<IContentQualityCheck>("ContentQualityCheck", contentQualityCheckSchema);

export default ContentQualityCheck;
