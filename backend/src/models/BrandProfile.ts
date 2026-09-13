import mongoose, { Document, Schema, Types } from "mongoose";
import { ISourceReference, sourceReferenceSchema } from "./common/sourceReference";

/**
 * Step 7: Brand Profile - one document per organization, focused
 * specifically on voice/tone/messaging/claims (a subset of
 * CompanyIntelligence, kept as its own collection so brand-specific
 * fields can evolve independently, e.g. from a future manual brand
 * questionnaire rather than only LLM extraction).
 */
export interface IBrandProfile extends Document {
  organizationId: Types.ObjectId;

  brandVoice?: string;
  tone?: string;
  preferredMessagingStyle?: string;

  targetAudience: string[];
  positioning?: string;
  keyMessaging: string[];

  allowedClaims: string[];
  forbiddenClaims: string[];

  sourceReferences: ISourceReference[];
  generatedAt?: Date;
}

const brandProfileSchema = new Schema<IBrandProfile>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      unique: true,
      index: true,
    },

    brandVoice: { type: String },
    tone: { type: String },
    preferredMessagingStyle: { type: String },

    targetAudience: { type: [String], default: [] },
    positioning: { type: String },
    keyMessaging: { type: [String], default: [] },

    allowedClaims: { type: [String], default: [] },
    forbiddenClaims: { type: [String], default: [] },

    sourceReferences: { type: [sourceReferenceSchema], default: [] },
    generatedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

const BrandProfile = mongoose.model<IBrandProfile>("BrandProfile", brandProfileSchema);

export default BrandProfile;
