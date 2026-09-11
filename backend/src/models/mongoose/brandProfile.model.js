import mongoose from "mongoose";

const BrandProfileSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true
    },

    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true
    },

    brandName: {
      type: String,
      required: true
    },

    tagline: String,

    description: String,

    mission: String,

    vision: String,

    values: [String],

    toneOfVoice: {
      type: [String],
      default: []
    },

    targetAudience: String,

    brandColors: {
      primary: String,
      secondary: String,
      accent: String
    },

    fonts: {
      primary: String,
      secondary: String
    },

    logoUrl: String,

    guidelines: String,

    keywords: [String],

    status: {
      type: String,
      enum: ["draft", "active", "archived"],
      default: "draft"
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model(
  "BrandProfile",
  BrandProfileSchema
);