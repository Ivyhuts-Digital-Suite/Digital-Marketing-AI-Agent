import mongoose, { Document, Schema, Types } from "mongoose";

/**
 * Phase 11 - Step 8: AnalyticsFinding.
 *
 * Structured output of the deterministic Analytics Engine (never the
 * LLM) - every numeric field here is computed from real MarketingMetric/
 * MarketingEvent data. The Analytics Agent interprets a finding; it never
 * produces one.
 */
export type AnalyticsFindingType =
  | "ANOMALY"
  | "TREND"
  | "UNDERPERFORMANCE"
  | "HIGH_PERFORMANCE"
  | "AUDIENCE_CHANGE"
  | "CONVERSION_PROBLEM";

export type AnalyticsFindingSeverity = "low" | "medium" | "high";

export type AffectedEntityType = "content" | "campaign" | "channel" | "audience";

export interface IAnalyticsFindingEvidenceItem {
  label: string;
  value?: number;
  unit?: string;
}

export interface IAffectedEntity {
  type: AffectedEntityType;
  id?: string;
  label: string;
}

const FINDING_TYPES: AnalyticsFindingType[] = [
  "ANOMALY",
  "TREND",
  "UNDERPERFORMANCE",
  "HIGH_PERFORMANCE",
  "AUDIENCE_CHANGE",
  "CONVERSION_PROBLEM",
];
const SEVERITIES: AnalyticsFindingSeverity[] = ["low", "medium", "high"];
const AFFECTED_ENTITY_TYPES: AffectedEntityType[] = ["content", "campaign", "channel", "audience"];

export interface IAnalyticsFinding extends Document {
  organizationId: Types.ObjectId;
  findingType: AnalyticsFindingType;
  severity: AnalyticsFindingSeverity;
  metric: string;
  observedValue: number;
  baselineValue?: number;
  changePercent?: number;
  affectedEntity: IAffectedEntity;
  evidence: IAnalyticsFindingEvidenceItem[];
  /** 0-1, computed deterministically (sample size / deviation magnitude) - never LLM-assigned. */
  confidence: number;
  detectedAt: Date;
  periodStart: Date;
  periodEnd: Date;
}

const evidenceItemSchema = new Schema<IAnalyticsFindingEvidenceItem>(
  { label: { type: String, required: true }, value: { type: Number }, unit: { type: String } },
  { _id: false }
);

const affectedEntitySchema = new Schema<IAffectedEntity>(
  {
    type: { type: String, enum: AFFECTED_ENTITY_TYPES, required: true },
    id: { type: String },
    label: { type: String, required: true },
  },
  { _id: false }
);

const analyticsFindingSchema = new Schema<IAnalyticsFinding>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    findingType: { type: String, enum: FINDING_TYPES, required: true, index: true },
    severity: { type: String, enum: SEVERITIES, required: true },
    metric: { type: String, required: true },
    observedValue: { type: Number, required: true },
    baselineValue: { type: Number },
    changePercent: { type: Number },
    affectedEntity: { type: affectedEntitySchema, required: true },
    evidence: { type: [evidenceItemSchema], default: [] },
    confidence: { type: Number, required: true, min: 0, max: 1 },
    detectedAt: { type: Date, required: true, index: true },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
  },
  { timestamps: true }
);

analyticsFindingSchema.index({ organizationId: 1, detectedAt: -1 });

const AnalyticsFinding = mongoose.model<IAnalyticsFinding>("AnalyticsFinding", analyticsFindingSchema);

export default AnalyticsFinding;
