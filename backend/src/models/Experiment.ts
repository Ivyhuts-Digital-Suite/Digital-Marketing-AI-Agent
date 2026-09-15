import mongoose, { Document, Schema, Types } from "mongoose";

/**
 * Phase 11 - Step 15: Experimentation foundation.
 */
export type ExperimentStatus = "draft" | "running" | "completed" | "aborted";

const STATUSES: ExperimentStatus[] = ["draft", "running", "completed", "aborted"];

export interface IExperimentArm {
  label: string;
  contentItemId?: Types.ObjectId;
  description: string;
}

export interface IExperiment extends Document {
  organizationId: Types.ObjectId;
  hypothesis: string;
  control: IExperimentArm;
  variant: IExperimentArm;
  metric: string;
  startDate: Date;
  endDate?: Date;
  targetAudience?: string;
  status: ExperimentStatus;
}

const armSchema = new Schema<IExperimentArm>(
  {
    label: { type: String, required: true },
    contentItemId: { type: Schema.Types.ObjectId, ref: "ContentItem" },
    description: { type: String, required: true },
  },
  { _id: false }
);

const experimentSchema = new Schema<IExperiment>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    hypothesis: { type: String, required: true },
    control: { type: armSchema, required: true },
    variant: { type: armSchema, required: true },
    metric: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    targetAudience: { type: String },
    status: { type: String, enum: STATUSES, default: "draft", required: true, index: true },
  },
  { timestamps: true }
);

const Experiment = mongoose.model<IExperiment>("Experiment", experimentSchema);

export default Experiment;
