import mongoose from "mongoose";

const CompetitorSchema = new mongoose.Schema(
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
      required: true
    },

    name: {
      type: String,
      required: true
    },

    website: String,
    description: String,
    industry: String,
    products: [String],
    pricing: String,
    positioning: String,
    valueProposition: String,
    strengths: [String],
    weaknesses: [String],
    targetAudience: [String],
    channels: [String],

    socialProfiles: {
      instagram: String,
      facebook: String,
      youtube: String
    },

    lastResearchAt: Date,

    researchStatus: {
      type: String,
      enum: ["pending", "active", "stale"],
      default: "pending"
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model("Competitor", CompetitorSchema);