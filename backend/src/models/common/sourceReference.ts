import { Schema, Types } from "mongoose";

/**
 * Shared "where did this fact come from" shape, embedded (not a separate
 * collection) inside CompanyIntelligence, BrandProfile, Product, and
 * Service so each record can point back at the KnowledgeSource/website
 * page/onboarding data it was generated from.
 *
 * Kept intentionally small - this is provenance for future agents to
 * inspect, not a full audit log.
 */
export type SourceReferenceType = "onboarding" | "website" | "document" | "knowledge_chunk";

export interface ISourceReference {
  sourceType: SourceReferenceType;
  /** KnowledgeSource._id, when this reference points at one. */
  sourceId?: Types.ObjectId;
  /** Website URL, when this reference is a crawled page. */
  url?: string;
  /** Human-readable label (filename, page title, etc.). */
  label?: string;
}

export const sourceReferenceSchema = new Schema<ISourceReference>(
  {
    sourceType: {
      type: String,
      enum: ["onboarding", "website", "document", "knowledge_chunk"],
      required: true,
    },
    sourceId: { type: Schema.Types.ObjectId, ref: "KnowledgeSource" },
    url: { type: String },
    label: { type: String },
  },
  { _id: false }
);
