import mongoose from "mongoose";

const PersonaSchema = new mongoose.Schema(
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

    name: {
      type: String,
      required: true
    },

    jobTitles: [String],
    seniority: [String],
    industries: [String],
    companySizes: [String],
    geographies: [String],
    goals: [String],
    painPoints: [String],
    challenges: [String],
    buyingMotivations: [String],
    objections: [String],
    decisionCriteria: [String],
    buyingTriggers: [String],
    preferredChannels: [String],
    contentPreferences: [String],
    messagingGuidelines: [String],

    priority: {
      type: Number,
      default: 0
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active"
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model("Persona", PersonaSchema);