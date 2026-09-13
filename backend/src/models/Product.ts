import mongoose, { Document, Schema, Types } from "mongoose";
import { ISourceReference, sourceReferenceSchema } from "./common/sourceReference";

/**
 * Step 7: Product - one organization can have many products. Populated
 * (created/updated) by CompanyIntelligenceService from LLM-extracted
 * company knowledge; also referenced from CompanyIntelligence.products.
 */
export interface IProduct extends Document {
  organizationId: Types.ObjectId;
  name: string;
  description?: string;
  targetAudience?: string;
  problemsSolved: string[];
  benefits: string[];
  differentiators: string[];
  sourceReferences: ISourceReference[];
}

const productSchema = new Schema<IProduct>(
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

productSchema.index({ organizationId: 1, name: 1 });

const Product = mongoose.model<IProduct>("Product", productSchema);

export default Product;
