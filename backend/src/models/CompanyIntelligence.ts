import mongoose, { Document, Schema, Types } from "mongoose";
import { ISourceReference, sourceReferenceSchema } from "./common/sourceReference";

/**
 * Step 7: Company Intelligence.
 *
 * One document per organization - structured, LLM-extracted knowledge
 * about the company, built from KnowledgeSource/KnowledgeChunk content by
 * CompanyIntelligenceService. Products and Services are kept as their own
 * collections (richer, independently queryable/updatable) and referenced
 * here rather than duplicated.
 *
 * Every array field defaults to [] rather than being left undefined, so
 * "we don't know yet" always reads as "empty", never as invented content.
 */
export interface ICompanyIntelligence extends Document {
  organizationId: Types.ObjectId;

  companyOverview?: string;
  industry?: string;

  targetCustomers: string[];
  customerProblems: string[];

  products: Types.ObjectId[];
  services: Types.ObjectId[];

  differentiators: string[];
  competitors: string[];
  valuePropositions: string[];

  brandVoice?: string;
  marketingMessaging: string[];
  allowedClaims: string[];
  forbiddenClaims: string[];

  importantFacts: string[];

  sourceReferences: ISourceReference[];

  /** When this record was last (re)generated. Distinct from updatedAt in case of future non-generation edits. */
  generatedAt?: Date;
  /** Increments every time this org's intelligence is regenerated. */
  version: number;
}

const companyIntelligenceSchema = new Schema<ICompanyIntelligence>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      unique: true,
      index: true,
    },

    companyOverview: { type: String },
    industry: { type: String },

    targetCustomers: { type: [String], default: [] },
    customerProblems: { type: [String], default: [] },

    products: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    services: [{ type: Schema.Types.ObjectId, ref: "Service" }],

    differentiators: { type: [String], default: [] },
    competitors: { type: [String], default: [] },
    valuePropositions: { type: [String], default: [] },

    brandVoice: { type: String },
    marketingMessaging: { type: [String], default: [] },
    allowedClaims: { type: [String], default: [] },
    forbiddenClaims: { type: [String], default: [] },

    importantFacts: { type: [String], default: [] },

    sourceReferences: { type: [sourceReferenceSchema], default: [] },

    generatedAt: { type: Date },
    version: { type: Number, default: 1, required: true },
  },
  {
    timestamps: true,
  }
);

const CompanyIntelligence = mongoose.model<ICompanyIntelligence>(
  "CompanyIntelligence",
  companyIntelligenceSchema
);

export default CompanyIntelligence;
