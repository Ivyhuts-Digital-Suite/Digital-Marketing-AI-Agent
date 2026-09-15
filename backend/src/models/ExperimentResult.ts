import mongoose, { Document, Schema, Types } from "mongoose";

/**
 * Phase 11 - Step 15: ExperimentResult.
 *
 * statisticallySignificant is "insufficient_data" (never a guessed true/
 * false) whenever the sample sizes are too small for the significance
 * test used - see services/analytics/experimentation/experimentService.ts.
 */
export interface IExperimentResult extends Document {
  organizationId: Types.ObjectId;
  experimentId: Types.ObjectId;
  controlValue?: number;
  variantValue?: number;
  sampleSizeControl?: number;
  sampleSizeVariant?: number;
  changePercent?: number;
  statisticallySignificant: boolean | "insufficient_data";
  pValue?: number;
  conclusion: string;
  computedAt: Date;
}

const experimentResultSchema = new Schema<IExperimentResult>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    experimentId: { type: Schema.Types.ObjectId, ref: "Experiment", required: true, index: true },
    controlValue: { type: Number },
    variantValue: { type: Number },
    sampleSizeControl: { type: Number },
    sampleSizeVariant: { type: Number },
    changePercent: { type: Number },
    statisticallySignificant: { type: Schema.Types.Mixed, required: true },
    pValue: { type: Number },
    conclusion: { type: String, required: true },
    computedAt: { type: Date, required: true },
  },
  { timestamps: true }
);

const ExperimentResult = mongoose.model<IExperimentResult>("ExperimentResult", experimentResultSchema);

export default ExperimentResult;
