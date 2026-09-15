import mongoose, { Document, Schema, Types } from "mongoose";

/**
 * Phase 11 - Step 13/14: OptimizationExecution.
 *
 * One row per execution attempt of an APPROVED OptimizationRecommendation.
 * result is "requires_phase10_integration" (never "executed") whenever the
 * MarketingIntegrationProvider adapter reports the needed tool isn't
 * available - see services/analytics/adapters/marketingIntegrationAdapter.ts.
 * This is the record that makes "don't fake execution success" auditable:
 * a recommendation can only ever be reported as truly executed if a row
 * here says so.
 */
export type OptimizationExecutionResult = "executed" | "requires_phase10_integration" | "failed";

const RESULTS: OptimizationExecutionResult[] = ["executed", "requires_phase10_integration", "failed"];

export interface IExecutionMeasurement {
  metric: string;
  beforeValue?: number;
  afterValue?: number;
  changePercent?: number;
  measuredAt: Date;
}

export interface IOptimizationExecution extends Document {
  organizationId: Types.ObjectId;
  recommendationId: Types.ObjectId;
  requiredTool: string;
  attemptedAt: Date;
  result: OptimizationExecutionResult;
  resultMessage: string;
  measurementWindowDays?: number;
  measurement: IExecutionMeasurement[];
}

const measurementSchema = new Schema<IExecutionMeasurement>(
  {
    metric: { type: String, required: true },
    beforeValue: { type: Number },
    afterValue: { type: Number },
    changePercent: { type: Number },
    measuredAt: { type: Date, required: true },
  },
  { _id: false }
);

const optimizationExecutionSchema = new Schema<IOptimizationExecution>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    recommendationId: { type: Schema.Types.ObjectId, ref: "OptimizationRecommendation", required: true, index: true },
    requiredTool: { type: String, required: true },
    attemptedAt: { type: Date, required: true },
    result: { type: String, enum: RESULTS, required: true },
    resultMessage: { type: String, required: true },
    measurementWindowDays: { type: Number },
    measurement: { type: [measurementSchema], default: [] },
  },
  { timestamps: true }
);

const OptimizationExecution = mongoose.model<IOptimizationExecution>("OptimizationExecution", optimizationExecutionSchema);

export default OptimizationExecution;
