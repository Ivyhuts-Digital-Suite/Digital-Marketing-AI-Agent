import mongoose, { Document, Schema, Types } from "mongoose";
import { ISourceReference, sourceReferenceSchema } from "./common/sourceReference";

/**
 * Step 7: Service - one organization can have many services. Same shape
 * as Product, kept as a separate collection since products and services
 * are distinct concepts for a marketing agent (e.g. "software product"
 * vs. "consulting service").
 */
export interface IService extends Document {
  organizationId: Types.ObjectId;
  name: string;
  description?: string;
  targetAudience?: string;
  problemsSolved: string[];
  benefits: string[];
  differentiators: string[];
  sourceReferences: ISourceReference[];
}

const serviceSchema = new Schema<IService>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    name: { type: String, required: true, trim: true },
    description: { type: String },
    targetAudience: { type: String },

    problemsSolved: { type: [String], default: [] },
    benefits: { type: [String], default: [] },
    differentiators: { type: [String], default: [] },

    sourceReferences: { type: [sourceReferenceSchema], default: [] },
  },
  {
    timestamps: true,
  }
);

serviceSchema.index({ organizationId: 1, name: 1 });

const Service = mongoose.model<IService>("Service", serviceSchema);

export default Service;
