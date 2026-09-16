import mongoose, { Document, Schema } from "mongoose";

/**
 * The tenant boundary every organizationId field elsewhere in this codebase
 * (CompanyIntelligence, ContentPlan, CreativeBrief, ...) has always
 * referenced by convention (`ref: "Organization"`) without a model to back
 * it. This is that model - deliberately minimal (see
 * backend/docs/future-schema-reference/organization.model.js for a richer,
 * not-yet-needed sketch with billing/subscription fields).
 */
export interface IOrganization extends Document {
  name: string;
  slug: string;
  description?: string;
  website?: string;
  industry?: string;
  size?: string;
}

const organizationSchema = new Schema<IOrganization>(
  {
    name: { type: String, required: true, trim: true },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    description: { type: String, trim: true },
    website: { type: String, trim: true },
    industry: { type: String, trim: true },
    size: { type: String, trim: true },
  },
  {
    timestamps: true,
  }
);

const Organization = mongoose.model<IOrganization>("Organization", organizationSchema);

export default Organization;
