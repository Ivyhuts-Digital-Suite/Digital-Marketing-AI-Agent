import mongoose, { Document, Schema, Types } from "mongoose";

/**
 * Phase 11 - Step 9: AnalyticsReport.
 *
 * Persisted output of the Analytics Agent's LLM interpretation of one or
 * more already-computed AnalyticsFinding documents. The agent never
 * produces a finding itself (see engine/analyticsEngineService.ts) - it
 * only ever explains findings that already exist, grounded in their own
 * evidence[].
 */
export interface IAnalyticsReportEntry {
  findingId: Types.ObjectId;
  interpretation: string;
  possibleCauses: string[];
  businessImpact: string;
}

export interface IAnalyticsReport extends Document {
  organizationId: Types.ObjectId;
  periodStart: Date;
  periodEnd: Date;
  entries: IAnalyticsReportEntry[];
  generatedAt: Date;
}

const analyticsReportEntrySchema = new Schema<IAnalyticsReportEntry>(
  {
    findingId: { type: Schema.Types.ObjectId, ref: "AnalyticsFinding", required: true },
    interpretation: { type: String, required: true },
    possibleCauses: { type: [String], default: [] },
    businessImpact: { type: String, required: true },
  },
  { _id: false }
);

const analyticsReportSchema = new Schema<IAnalyticsReport>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    entries: { type: [analyticsReportEntrySchema], default: [] },
    generatedAt: { type: Date, required: true },
  },
  { timestamps: true }
);

analyticsReportSchema.index({ organizationId: 1, generatedAt: -1 });

const AnalyticsReport = mongoose.model<IAnalyticsReport>("AnalyticsReport", analyticsReportSchema);

export default AnalyticsReport;
