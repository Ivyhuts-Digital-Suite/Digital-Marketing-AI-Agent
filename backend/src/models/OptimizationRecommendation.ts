import mongoose, { Document, Schema, Types } from "mongoose";
import { AffectedEntityType } from "./AnalyticsFinding";

/**
 * Phase 11 - Step 11: OptimizationRecommendation.
 *
 * Every hypothesis carries evidenceRefs pointing back at indexes into the
 * triggering AnalyticsFinding's own evidence[] array - structurally
 * preventing a hypothesis from citing evidence that was never actually
 * observed (see optimization/optimizationRecommendationService.ts, which
 * validates every evidenceRef is in range before persisting).
 *
 * status is a strict state machine (see optimization/approvalService.ts,
 * executionService.ts): only APPROVED can move to EXECUTING/EXECUTED, and
 * nothing in this codebase transitions a recommendation to EXECUTED
 * without a real OptimizationExecution record backing it - see
 * OptimizationExecution.ts.
 */
export type OptimizationRecommendationStatus =
  | "GENERATED"
  | "REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "EXECUTING"
  | "EXECUTED"
  | "MEASURING"
  | "COMPLETED"
  | "FAILED";

export type OptimizationRiskLevel = "low" | "medium" | "high";

export interface IOptimizationHypothesis {
  hypothesis: string;
  /** Indexes into the triggering AnalyticsFinding.evidence[] array that support this hypothesis. */
  evidenceRefs: number[];
}

export interface IOptimizationAffectedEntity {
  type: AffectedEntityType;
  id?: string;
  label: string;
}

const STATUSES: OptimizationRecommendationStatus[] = [
  "GENERATED",
  "REVIEW",
  "APPROVED",
  "REJECTED",
  "EXECUTING",
  "EXECUTED",
  "MEASURING",
  "COMPLETED",
  "FAILED",
];
const RISK_LEVELS: OptimizationRiskLevel[] = ["low", "medium", "high"];

export interface IOptimizationRecommendation extends Document {
  organizationId: Types.ObjectId;
  triggerFindingId: Types.ObjectId;
  diagnosis: string;
  hypotheses: IOptimizationHypothesis[];
  recommendedAction: string;
  expectedImpact: string;
  confidence: number;
  affectedEntities: IOptimizationAffectedEntity[];
  /** Names of Phase 10 tools this action would need (e.g. "publish_instagram_post") - not owned/validated here since Phase 10 doesn't exist yet in this codebase. */
  requiredTools: string[];
  riskLevel: OptimizationRiskLevel;
  status: OptimizationRecommendationStatus;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  rejectionReason?: string;
}

const hypothesisSchema = new Schema<IOptimizationHypothesis>(
  { hypothesis: { type: String, required: true }, evidenceRefs: { type: [Number], default: [] } },
  { _id: false }
);

const affectedEntitySchema = new Schema<IOptimizationAffectedEntity>(
  {
    type: { type: String, enum: ["content", "campaign", "channel", "audience"], required: true },
    id: { type: String },
    label: { type: String, required: true },
  },
  { _id: false }
);

const optimizationRecommendationSchema = new Schema<IOptimizationRecommendation>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    triggerFindingId: { type: Schema.Types.ObjectId, ref: "AnalyticsFinding", required: true },
    diagnosis: { type: String, required: true },
    hypotheses: { type: [hypothesisSchema], default: [] },
    recommendedAction: { type: String, required: true },
    expectedImpact: { type: String, required: true },
    confidence: { type: Number, required: true, min: 0, max: 1 },
    affectedEntities: { type: [affectedEntitySchema], default: [] },
    requiredTools: { type: [String], default: [] },
    riskLevel: { type: String, enum: RISK_LEVELS, required: true },
    status: { type: String, enum: STATUSES, default: "GENERATED", required: true, index: true },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
    rejectionReason: { type: String },
  },
  { timestamps: true }
);

optimizationRecommendationSchema.index({ organizationId: 1, status: 1, createdAt: -1 });

const OptimizationRecommendation = mongoose.model<IOptimizationRecommendation>(
  "OptimizationRecommendation",
  optimizationRecommendationSchema
);

export default OptimizationRecommendation;
